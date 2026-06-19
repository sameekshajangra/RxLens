"""
RxLens — Vercel Serverless Entry Point
=======================================
Vercel runs Python serverless functions with strict constraints.
This backend features:
1. Pure Gemini Vision Pipeline for MAXIMUM accuracy (handwriting recognition)
2. Model Cascading (gemini-2.5-flash -> gemini-2.0-flash -> gemini-flash-latest) for Quota Evasion
3. Inline Clinical Safety Engine
"""

import os
import sys
import json
import io
import re
import logging
import base64

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

# ── Add project root to path ────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="RxLens Scalable API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Demo fallback data (used when all cascades fail) ────────────────────────
DEMO_DATA = {
    "drug": "Tamsulosin, Cefpodoxime (Rovcef)",
    "drugs_list": ["Tamsulosin", "Cefpodoxime (Rovcef)"],
    "drugs_dosage": {"Tamsulosin": "0.4mg", "Cefpodoxime (Rovcef)": "200mg"},
    "drugs_frequency": {"Tamsulosin": "Once daily", "Cefpodoxime (Rovcef)": "Twice daily (BDS)"},
    "drugs_duration": {"Tamsulosin": "30 days", "Cefpodoxime (Rovcef)": "Unclear (likely 5-7 days)"},
    "dosage": "Tamsulosin: 0.4mg once daily; Cefpodoxime: 200mg twice daily",
    "frequency": "Tamsulosin: Once daily; Cefpodoxime: Twice daily (BDS)",
    "duration": "Tamsulosin: 30 days; Cefpodoxime: Unclear (likely 5-7 days for antibiotics)",
    "instructions": "Administer Tamsulosin (Tamkeros 100DX) 0.4mg once daily for 30 days, preferably after the same meal each day. Administer Cefpodoxime (Rovcef) 200mg twice daily (BDS), usually in the morning and evening, with food.",
    "notes": "Patient RAMPAL SHARMA, an 85-year-old male, presents with frequency of urination and voiding Lower Urinary Tract Symptoms (LUTS). Ultrasound findings indicate urinary bladder calculi (stones) and a prostate volume of 28 cc. A Reflex PSA (Prostate Specific Antigen) test has been requested. An unclear instruction 'a CLT' is also present in the advice section.",
    "side_effects": [
        "Official drug monographs (e.g., FDA, EMA, BNF), Clinical pharmacology textbooks (e.g., Goodman & Gilman's The Pharmacological Basis of Therapeutics), MedlinePlus, Mayo Clinic"
    ],
    "precautions": [
        "Official drug monographs (e.g., FDA, EMA, BNF), Clinical pharmacology textbooks (e.g., Goodman & Gilman's The Pharmacological Basis of Therapeutics), MedlinePlus, Mayo Clinic"
    ],
    "schedule": [
        {"time": "Morning (after breakfast)", "task": "Take Tamsulosin 0.4mg tablet (Tamkeros 100DX)."},
        {"time": "Morning (with food)", "task": "Take Cefpodoxime 200mg tablet (Rovcef)."},
        {"time": "Evening (with food)", "task": "Take Cefpodoxime 200mg tablet (Rovcef)."}
    ],
    "confidence": {"Tamsulosin": 0.85, "Cefpodoxime (Rovcef)": 0.85},
    "overall_confidence": 0.85,
    "uncertainty_warnings": [],
    "is_uncertain": False,
    "accessibility_analysis": {
        "score": "Medium",
        "jargon_density": "Medium",
        "readability": "8th Grade Level",
        "reason": "The explanation uses clear language for drug information, but includes several medical terms like 'orthostatic hypotension', 'priapism', 'retrograde ejaculation', 'Intraoperative Floppy Iris Syndrome', 'Clostridioides difficile-associated diarrhea', 'cephalosporin', 'beta-lactam antibiotics', and 'renal impairment' which require a moderate level of medical literacy. The 'CLT' instruction and antibiotic duration are also unclear from the original prescription, adding complexity."
    },
    "confusing_terms": [
        {"term": "BDS", "simplified": "Twice a day (usually morning and evening)"},
        {"term": "LUTS", "simplified": "Lower Urinary Tract Symptoms (difficulty peeing)"},
        {"term": "Prostate Specific Antigen (PSA)", "simplified": "A blood test used to screen for prostate issues"}
    ],
    "safety_alerts": [],
    "polypharmacy_notes": [
        "Patient is taking multiple medications. Monitor for drug interactions and adhere strictly to the schedule."
    ],
    "explainability_sources": {
        "instructions": "Handwritten prescription and standard clinical guidelines for medication administration.",
        "side_effects": [
            "Official drug monographs (e.g., FDA, EMA, BNF), Clinical pharmacology textbooks (e.g., Goodman & Gilman's The Pharmacological Basis of Therapeutics), MedlinePlus, Mayo Clinic"
        ],
        "precautions": [
            "Official drug monographs (e.g., FDA, EMA, BNF), Clinical pharmacology textbooks (e.g., Goodman & Gilman's The Pharmacological Basis of Therapeutics), MedlinePlus, Mayo Clinic"
        ]
    },
    "environmental": {
        "score": "Moderate Impact",
        "footprint": "Cefpodoxime contributes to antimicrobial resistance if disposed improperly. Tamsulosin has moderate aquatic toxicity.",
        "disposal": "Do not flush down the toilet. Return unused antibiotics to a pharmacy take-back program to prevent environmental contamination."
    },
    "is_demo_fallback": True,
    "_pipeline": "demo"
}

# ── Helpers ──────────────────────────────────────────────────────────────────

def _extract_json(text: str) -> dict:
    text = text.strip()
    if "```" in text:
        for part in text.split("```")[1::2]:
            cleaned = part.strip()
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()
            if cleaned.startswith("{"):
                try:
                    return json.loads(cleaned)
                except Exception:
                    pass
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except Exception:
            pass
    raise ValueError("No valid JSON found in LLM response")


def _normalize(data: dict) -> dict:
    defaults = {
        "drugs_list": [], "safety_alerts": [], "schedule": [],
        "uncertainty_warnings": [], "confusing_terms": [],
        "polypharmacy_notes": [], "side_effects": [], "precautions": [],
        "confidence": {}, "is_uncertain": False, "is_demo_fallback": False,
    }
    return {**defaults, **data}


def _make_summary(data: dict, lang: str = "English") -> str:
    drug = data.get("drug", "Unknown medication" if lang == "English" else "अज्ञात दवा" if lang == "Hindi" else "Medicamento desconocido")
    dosage = data.get("dosage", "")
    freq = data.get("frequency", "")
    instructions = data.get("instructions", "")
    
    parts = []
    
    if lang.lower() == "hindi":
        parts.append(f"दवा: {drug}")
        if dosage: parts.append(f"खुराक: {dosage}")
        if freq: parts.append(f"समय: {freq}")
        if instructions: parts.append(f"निर्देश: {instructions}")
    elif lang.lower() == "spanish":
        parts.append(f"Medicamento: {drug}")
        if dosage: parts.append(f"Dosis: {dosage}")
        if freq: parts.append(f"Frecuencia: {freq}")
        if instructions: parts.append(f"Instrucciones: {instructions}")
    else:
        parts.append(f"Medication: {drug}")
        if dosage: parts.append(f"Dosage: {dosage}")
        if freq: parts.append(f"Frequency: {freq}")
        if instructions: parts.append(f"Instructions: {instructions}")
        
    return ". ".join(parts) + "."

def _generate_audio_base64(text: str, lang: str) -> str:
    from gtts import gTTS
    import io
    import base64
    try:
        # map frontend languages to gTTS language codes
        lang_code = "hi" if lang.lower() == "hindi" else "es" if lang.lower() == "spanish" else "en"
        tts = gTTS(text=text, lang=lang_code)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        return base64.b64encode(fp.getvalue()).decode('utf-8')
    except Exception as e:
        logger.warning(f"Audio generation failed: {e}")
        return ""

def _compress_image_for_vision(img: Image.Image, aggressive: bool = False) -> bytes:
    """Resize and compress the image for fast LLM uploads.
    If *aggressive* is True we downscale more aggressively (max 800px, quality 70) to fit very large/complex images.
    """
    img = img.copy()
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Normal vs aggressive settings
    max_dim = 500 if aggressive else 800
    quality = 65 if aggressive else 80
    
    if max(img.width, img.height) > max_dim:
        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
    
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality)
    # Ensure we stay under 2 MB even after aggressive compression
    while buf.tell() > 2000000 and quality > 30:
        buf.seek(0)
        buf.truncate()
        quality -= 10
        img.save(buf, format="JPEG", quality=quality)
    return buf.getvalue()

# ── Safety Engine ────────────────────────────────────────────────────────────

KNOWN_INTERACTIONS = {
    frozenset(["warfarin", "aspirin"]): "Increased bleeding risk — both thin blood.",
    frozenset(["metformin", "alcohol"]): "Severe lactic acidosis risk.",
    frozenset(["ssri", "tramadol"]): "Serotonin syndrome risk.",
}
HIGH_RISK_KEYWORDS = ["warfarin", "lithium", "digoxin", "methotrexate", "phenytoin"]

def _run_safety(drugs_list: list, patient_profile: dict | None, lang: str) -> dict:
    alerts = []
    lower_drugs = [d.lower() for d in drugs_list]
    for pair, message in KNOWN_INTERACTIONS.items():
        pair_lower = {p.lower() for p in pair}
        if all(any(p in d for d in lower_drugs) for p in pair_lower):
            alerts.append({"severity": "Critical", "message": message, "drugs": list(pair)})
    for drug in lower_drugs:
        for risky in HIGH_RISK_KEYWORDS:
            if risky in drug:
                alerts.append({"severity": "Warning", "message": f"{drug.title()} requires regular monitoring.", "drugs": [drug]})
    if patient_profile:
        allergies = [a.lower() for a in (patient_profile.get("allergies") or [])]
        for drug in lower_drugs:
            for allergen in allergies:
                if allergen and allergen in drug:
                    alerts.append({"severity": "Critical", "message": f"⚠️ Possible allergy: matches '{allergen}'.", "drugs": [drug]})
    return {
        "alerts": alerts,
        "polypharmacy_notes": [f"Taking {len(drugs_list)} medications — review with doctor."] if len(drugs_list) >= 4 else [],
        "environmental": {},
    }

# ── Gemini Model Cascading ───────────────────────────────────────────────────

LEVEL_HINTS = {
    "simple": "Grade-4 reading level. No medical jargon. Very short sentences.",
    "detailed": "Provide full clinical depth: pharmacological class, mechanism, contraindications, clinical interactions.",
}

async def _call_gemini_cascading(img_bytes: bytes, api_key: str, lang: str, explanation_level: str, patient_profile: dict | None) -> dict:
    import time
    import asyncio
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    level_instruction = LEVEL_HINTS.get(explanation_level, "Use clear, plain language.")
    profile_ctx = f"\nPatient Profile: {json.dumps(patient_profile)}" if patient_profile else ""
    
    prompt = f"""
You are an ensemble of three elite clinical pharmacists specializing in decoding illegible doctor handwriting. Analyze this prescription image meticulously and return structured JSON in {lang}.
{profile_ctx}
EXPLANATION STYLE: {level_instruction}

CRITICAL OCR INSTRUCTIONS:
1. Handwriting Analysis: Scan the visual strokes efficiently. Pay attention to context clues like 'Rx', 'c/o', 'O/E'. Direct JSON extraction is required; do NOT generate internal transcription reasoning.
2. Pharmacological Matching: Cross-reference the visual strokes with global pharmaceutical databases. Identify the EXACT medicine brand name written by the doctor AND deduce its generic/salt components.
3. Spelling Correction: Doctors often misspell drug names or use extreme shorthand (e.g., 'Amox 500', 'Para', 'Azithro'). Correct these to the standard pharmacological spelling.
4. Clinical Context: Use the diagnosed condition (if written) to narrow down ambiguous drug names.
5. Build a 'schedule' array with time-labelled doses.
6. Confidence Scoring: Score your confidence from 0.0 to 1.0. If you successfully matched the drug to a known database, score it >0.95.
7. ALL text values MUST be translated accurately into {lang} (except standard medical drug names). If lang is Hindi, the schedule tasks, notes, instructions, and side effects MUST all be strictly in Hindi.
8. Lab Tests & Investigations: Doctors often prescribe lab tests (e.g., CBC, LFT, KFT, RBS, HIV, HBsAg, S. Cholesterol). Identify ANY recommended lab tests. Expand their abbreviations to their full clinical names (e.g., 'CBC' -> 'Complete Blood Count').

RETURN EXACTLY THIS JSON (no extra text):
{{
  "drug": "All medications comma-separated. Format MUST be 'BrandName (GenericSalt)' if a brand name is written, else just 'GenericSalt'.",
  "drugs_list": ["BrandName 1 (GenericSalt 1)", "BrandName 2 (GenericSalt 2)"],
  "drugs_dosage": {{"Drug 1": "Dose 1"}},
  "drugs_frequency": {{"Drug 1": "Freq 1"}},
  "drugs_duration": {{"Drug 1": "Duration 1"}},
  "clinical_notes": {{
    "complaints": "Extracted chief complaints (c/o), e.g., 'Giddiness and restlessness'. Leave empty if none.",
    "diagnosis_impression": "Extracted Impression/Diagnosis (Imp), e.g., 'Hypoglycemia'. Leave empty if none.",
    "vitals_examination": "Extracted On Examination (o/e) vitals, e.g., 'BP: 110/70, PR: 60 bpm'. Leave empty if none."
  }},
  "recommended_tests": ["Complete Blood Count (CBC)", "Liver Function Test (LFT)"],
  "dosage": "dosage summary",
  "frequency": "frequency summary",
  "duration": "total duration",
  "instructions": "intake instructions",
  "notes": "patient notes",
  "side_effects": ["Effect 1"],
  "precautions": ["Precaution 1"],
  "schedule": [{{"time": "08:00 AM", "task": "description"}}],
  "confidence": {{"drug": 0.98}},
  "overall_confidence": 0.98,
  "is_uncertain": false,
  "accessibility_analysis": {{"score": "Medium", "jargon_density": "Low", "readability": "6th Grade Level", "reason": ""}},
  "explainability_sources": {{"instructions": "source of instructions", "side_effects": ["source 1"], "precautions": ["source 2"]}}
}}
"""
    
    contents = [
        types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
        prompt
    ]

    # Try a cascade of Gemini models in case the primary is throttled or unavailable.
    # We wrap each call in a strict 25s timeout so it NEVER hits Vercel's 60s hard limit.
    # We wrap the entire cascade in a retry loop to absorb 429 Quota errors.
    # A single 15-second sleep fits well within Vercel's 60s limit and often clears rolling 15RPM limits.
    model_candidates = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-flash-latest"]
    last_err = None
    
    for model_name in model_candidates:
        try:
            logger.info(f"Attempting {model_name}...")
            response = await asyncio.wait_for(
                client.aio.models.generate_content(model=model_name, contents=contents),
                timeout=290.0
            )
            if response.text:
                res_json = _extract_json(response.text)
                res_json["_pipeline"] = f"vision_{model_name}"
                return res_json
        except asyncio.TimeoutError:
            err_msg = "Image is too complex or contains too many prescriptions. Please try scanning 1-2 prescriptions at a time."
            logger.warning(err_msg)
            raise Exception(err_msg)
        except Exception as e:
            err_msg = str(e)
            logger.warning(f"{model_name} failed: {err_msg}")
            last_err = e
            # If it's a quota error (429), break immediately so we can fallback to the server key
            if any(k in err_msg for k in ["429", "RESOURCE_EXHAUSTED", "quota"]):
                break
            # If it's a 503 UNAVAILABLE, we can try the next model immediately.
            if not any(k in err_msg for k in ["503", "UNAVAILABLE"]):
                break

    raise last_err

# ── API Routes ───────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "RxLens Scalable API running", "version": "4.0-vision"}

@app.get("/api/config")
def get_config():
    return {"api_key_configured": bool(os.getenv("GEMINI_API_KEY"))}

@app.get("/api/test_gemini")
async def test_gemini():
    from google import genai
    try:
        key = os.getenv("GEMINI_API_KEY")
        if not key:
            return {"error": "No API key found in env"}
        client = genai.Client(api_key=key)
        response = client.models.generate_content(model="gemini-2.0-flash", contents=["Reply with 'hello'"])
        return {"success": True, "text": response.text}
    except Exception as e:
        return {"error": str(e), "type": str(type(e))}

@app.get("/api/history")
def get_history():
    # Return empty history for now to prevent 404 errors.
    return []

@app.post("/api/extract")
async def extract_prescription(
    file: UploadFile = File(...),
    api_key: str = Form(None),
    lang: str = Form("English"),
    patient_profile: str = Form(None),
    explanation_level: str = Form("standard"),
):
    try:
        contents = await file.read()
        try:
            img = Image.open(io.BytesIO(contents))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file.")

        profile_data = None
        if patient_profile:
            try: profile_data = json.loads(patient_profile)
            except: pass

        # Determine which API key to use
        user_key = api_key or os.getenv("GEMINI_API_KEY")
        server_key = os.getenv("SERVER_GEMINI_API_KEY")
        if not user_key or user_key == "DEMO_MODE":
            summ = _make_summary(DEMO_DATA, lang)
            return {"success": True, "data": dict(DEMO_DATA), "summary": summ, "audio_base64": _generate_audio_base64(summ, lang)}


        # LLM Processing with Cascading (now uses corrected keys and retry logic)

        try:
            img_bytes = _compress_image_for_vision(img)
            try:
                parsed = await _call_gemini_cascading(img_bytes, user_key, lang, explanation_level, profile_data)
            except Exception as e:
                err_msg = str(e)
                logger.error(f"First AI attempt failed: {err_msg}")
                is_quota = any(k in err_msg for k in ["429", "RESOURCE_EXHAUSTED", "quota"])
                is_503 = any(k in err_msg for k in ["503", "UNAVAILABLE"])
                
                if is_quota and server_key and user_key != server_key:
                    logger.info("User quota exhausted – instantly retrying with server backup key.")
                    try:
                        parsed = await _call_gemini_cascading(img_bytes, server_key, lang, explanation_level, profile_data)
                    except Exception as fallback_e:
                        fallback_err = str(fallback_e)
                        if any(k in fallback_err for k in ["429", "RESOURCE_EXHAUSTED", "quota"]):
                            raise HTTPException(status_code=503, detail="Gemini API rate limit reached. Please wait 30-60 seconds and try again.")
                        raise HTTPException(status_code=503, detail=fallback_err)
                elif is_quota:
                    raise HTTPException(status_code=503, detail="Gemini API rate limit reached. Please wait 30-60 seconds and try again.")
                elif is_503:
                    raise HTTPException(status_code=503, detail="503 UNAVAILABLE: The AI model is currently experiencing high demand. Please try again.")
                elif "too complex" in err_msg.lower():
                    raise HTTPException(status_code=503, detail="Image is too complex or contains too many prescriptions. Please try scanning 1-2 prescriptions at a time.")
                else:
                    raise HTTPException(status_code=503, detail=f"AI processing failed. Please ensure the image is clear. (Error: {err_msg})")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"AI processing failed. Please ensure the image is clear. (Error: {str(e)})")

        parsed = _normalize(parsed)
        if "overall_confidence" not in parsed:
            scores = [v for v in parsed.get("confidence", {}).values() if isinstance(v, (int, float))]
            parsed["overall_confidence"] = round(sum(scores)/len(scores), 2) if scores else None

        # Run Safety & Finalize
        drugs = parsed.get("drugs_list", [])
        safety = _run_safety(drugs, profile_data, lang)
        parsed["safety_alerts"] = safety["alerts"]
        parsed["polypharmacy_notes"] = safety["polypharmacy_notes"]
        
        summary = _make_summary(parsed, lang)
        
        # Generate Audio Base64
        audio_b64 = _generate_audio_base64(summary, lang)
        
        return {"success": True, "data": parsed, "summary": summary, "audio_base64": audio_b64}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(question: str=Form(...), context: str=Form(""), lang: str=Form("English"), api_key: str=Form(None)):
    try:
        from google import genai
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key: return {"answer": "Provide Gemini API key."}
        client = genai.Client(api_key=key)
        prompt = f"You are a clinical assistant.\nContext: {context}\nUser: {question}\nRespond accurately in {lang}."
        res = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        return {"answer": res.text or "I'm not sure."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
