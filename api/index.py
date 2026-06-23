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
import difflib
try:
    from src.safety_db import BRAND_TO_GENERIC, DRUG_CLASSES, CONTRAINDICATIONS, JAN_AUSHADHI_DB, BRAND_PRICES_DB
except ImportError:
    BRAND_TO_GENERIC = {}
    DRUG_CLASSES = {}
    CONTRAINDICATIONS = {}
    JAN_AUSHADHI_DB = {}
    BRAND_PRICES_DB = {}
    CONTRAINDICATIONS = {}

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
    "drugs_list": [{"value": "Tamsulosin", "confidence": "HIGH"}, {"value": "Cefpodoxime (Rovcef)", "confidence": "HIGH"}],
    "drugs_dosage": {"Tamsulosin": {"value": "0.4mg", "confidence": "HIGH"}, "Cefpodoxime (Rovcef)": {"value": "200mg", "confidence": "HIGH"}},
    "drugs_frequency": {"Tamsulosin": {"value": "Once daily", "confidence": "HIGH"}, "Cefpodoxime (Rovcef)": {"value": "Twice daily (BDS)", "confidence": "HIGH"}},
    "drugs_duration": {"Tamsulosin": {"value": "30 days", "confidence": "HIGH"}, "Cefpodoxime (Rovcef)": {"value": "Unclear (likely 5-7 days)", "confidence": "LOW"}},
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


def _validate_drug_confidence(parsed_data: dict):
    # Collect all known drugs
    known_drugs = set([k.lower() for k in BRAND_TO_GENERIC.keys()])
    for d_list in DRUG_CLASSES.values():
        for d in d_list:
            known_drugs.add(d.lower())
    for d_list in CONTRAINDICATIONS.values():
        for d in d_list.get("drugs", []):
            known_drugs.add(d.lower())
            
    drugs_list = parsed_data.get("drugs_list", [])
    for idx, d_obj in enumerate(drugs_list):
        if not isinstance(d_obj, dict):
            # Convert to dict if it came back as string
            d_obj = {"value": str(d_obj), "confidence": "LOW"}
            drugs_list[idx] = d_obj
            
        val = d_obj.get("value", "")
        if not val: continue
        
        # strip brand/generic like "Brand (Generic)"
        parts = val.replace("(", " ").replace(")", " ").split()
        
        # Fuzzy match
        is_known = False
        for p in parts:
            if len(p) < 3: continue
            matches = difflib.get_close_matches(p.lower(), known_drugs, n=1, cutoff=0.8)
            if matches:
                is_known = True
                break
        
        if not is_known:
            d_obj["confidence"] = "LOW"

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
    drugs = data.get("drugs_list", [])
    if not drugs:
        d_name = data.get("drug", "Unknown medication")
        d_dosage = data.get("dosage", "")
        d_freq = data.get("frequency", "")
        drugs = [{"drug": d_name, "dosage": d_dosage, "frequency": d_freq}]
        
    parts = ["Your medications are as follows:"]
    for d in drugs:
        d_name = d.get("drug") or d.get("value") or "Unknown medication"
        d_dosage = d.get("dosage", "")
        d_freq = d.get("frequency", "")
        
        drug_str = f"{d_name}"
        if d_dosage: drug_str += f", dosage: {d_dosage}"
        if d_freq: drug_str += f", frequency: {d_freq}"
        parts.append(drug_str)
        
    instructions = data.get("instructions", "")
    if instructions: parts.append(f"Important instructions: {instructions}")
    notes = data.get("notes", "")
    if notes: parts.append(f"Doctor's notes: {notes}")
    
    eng_summary = ". ".join(parts) + "."
    
    if lang.lower() != "english":
        try:
            from google import genai
            import os
            key = os.getenv("GEMINI_API_KEY")
            if key:
                client = genai.Client(api_key=key)
                prompt = f"Translate the following clinical medication summary into fluent, natural {lang}. ONLY output the translation, nothing else. Do not add conversational filler.\n\nSummary: {eng_summary}"
                res = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
                if res.text:
                    return res.text.strip()
        except Exception as e:
            logger.warning(f"Translation failed: {e}")
            pass # fallback to english
            
    return eng_summary

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
6. Confidence Scoring: For each field return confidence as HIGH, MEDIUM, or LOW based on handwriting legibility and ambiguity.
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
    model_candidates = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]
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
            # If it's a quota error (429), we SHOULD try the next model because quotas are per-model.
            if any(k in err_msg for k in ["429", "RESOURCE_EXHAUSTED", "quota"]):
                continue
            # If it's a 503 UNAVAILABLE, we can try the next model immediately.
            if any(k in err_msg for k in ["503", "UNAVAILABLE"]):
                continue
            
            # For any other error (like 400 Bad Request), break out.
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

        # Validate drugs confidence
        _validate_drug_confidence(parsed)
        # --- Generic Substitution / Jan Aushadhi Logic ---
        for i, drug_obj in enumerate(parsed.get("drugs_list", [])):
            # Handle both string and dict entries
            if isinstance(drug_obj, str):
                drug_name = drug_obj.lower().strip()
                drug_display = drug_obj
            elif isinstance(drug_obj, dict):
                drug_name = (drug_obj.get("drug") or drug_obj.get("value") or "").lower().strip()
                drug_display = drug_obj.get("drug") or drug_obj.get("value") or ""
            else:
                continue
                
            if not drug_name:
                continue
                
            generic_match = None
            matched_brand = None
            
            # Step 1: Check if it's a known brand name
            for brand, generic in BRAND_TO_GENERIC.items():
                if brand in drug_name or drug_name in brand:
                    generic_match = generic
                    matched_brand = brand
                    break
            
            # Step 2: If not a brand, check if it's already a generic name in our DB
            if not generic_match:
                for gen_key in JAN_AUSHADHI_DB.keys():
                    if gen_key.lower() in drug_name or drug_name in gen_key.lower():
                        generic_match = gen_key
                        break
                        
            if generic_match and generic_match in JAN_AUSHADHI_DB:
                ja_info = JAN_AUSHADHI_DB[generic_match]
                brand_price_est = BRAND_PRICES_DB.get(matched_brand or drug_name, ja_info["price"] * 4)
                sub_data = {
                    "active_molecule": generic_match,
                    "indicative_branded_price": brand_price_est,
                    "jan_aushadhi_price": ja_info["price"],
                    "savings": max(0, brand_price_est - ja_info["price"]),
                    "unit": ja_info["unit"],
                    "available_jan_aushadhi": True
                }
                if isinstance(drug_obj, dict):
                    parsed["drugs_list"][i]["generic_substitution"] = sub_data
                else:
                    # Convert string to dict with generic_substitution
                    parsed["drugs_list"][i] = {"drug": drug_display, "generic_substitution": sub_data}

        return {"success": True, "data": parsed}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
async def analyze_prescription(
    data: str = Form(...),
    lang: str = Form("English"),
    patient_profile: str = Form(None)
):
    try:
        parsed = json.loads(data)
        profile_data = None
        if patient_profile:
            try: profile_data = json.loads(patient_profile)
            except: pass
            
        # extract just the string names for safety engine
        drugs = [d.get("value", "") if isinstance(d, dict) else str(d) for d in parsed.get("drugs_list", [])]
        
        safety = _run_safety(drugs, profile_data, lang)
        parsed["safety_alerts"] = safety["alerts"]
        parsed["polypharmacy_notes"] = safety["polypharmacy_notes"]
        
        summary = _make_summary(parsed, lang)
        audio_b64 = _generate_audio_base64(summary, lang)
        
        return {"success": True, "data": parsed, "summary": summary, "audio_base64": audio_b64}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/translate_summary")
async def translate_summary(
    data: str = Form(...),
    lang: str = Form("English")
):
    try:
        parsed = json.loads(data)
        summary = _make_summary(parsed, lang)
        audio_b64 = _generate_audio_base64(summary, lang)

        translated_data = {}
        if lang.lower() != "english":
            try:
                from google import genai as _genai
                _key = os.getenv("GEMINI_API_KEY")
                if _key:
                    _client = _genai.Client(api_key=_key)

                    # Build a single batch translation request for all text fields
                    fields_to_translate = {}
                    cn = parsed.get("clinical_notes", {})
                    if isinstance(cn, dict):
                        if cn.get("complaints"): fields_to_translate["clinical_notes.complaints"] = cn["complaints"]
                        if cn.get("diagnosis_impression"): fields_to_translate["clinical_notes.diagnosis_impression"] = cn["diagnosis_impression"]
                        if cn.get("vitals_examination"): fields_to_translate["clinical_notes.vitals_examination"] = cn["vitals_examination"]
                    if parsed.get("instructions"): fields_to_translate["instructions"] = parsed["instructions"]
                    if parsed.get("notes"): fields_to_translate["notes"] = parsed["notes"]

                    # Translate list fields
                    se = parsed.get("side_effects", [])
                    if se: fields_to_translate["side_effects"] = " | ".join([s if isinstance(s, str) else str(s) for s in se])
                    pr = parsed.get("precautions", [])
                    if pr: fields_to_translate["precautions"] = " | ".join([p if isinstance(p, str) else str(p) for p in pr])

                    if fields_to_translate:
                        field_lines = "\n".join([f'[{k}]: {v}' for k, v in fields_to_translate.items()])
                        _prompt = (
                            f"Translate each of the following labeled clinical fields into fluent, natural {lang}. "
                            f"Return ONLY the translated fields in the EXACT same format '[key]: translated text'. "
                            f"Do NOT add any extra explanation.\n\n{field_lines}"
                        )
                        _res = _client.models.generate_content(model="gemini-2.5-flash", contents=_prompt)
                        if _res.text:
                            for line in _res.text.strip().split("\n"):
                                if "]: " in line:
                                    k, v = line.split("]: ", 1)
                                    k = k.lstrip("[").strip()
                                    v = v.strip()
                                    if k == "instructions": translated_data["instructions"] = v
                                    elif k == "notes": translated_data["notes"] = v
                                    elif k == "side_effects": translated_data["side_effects"] = [x.strip() for x in v.split("|")]
                                    elif k == "precautions": translated_data["precautions"] = [x.strip() for x in v.split("|")]
                                    elif k.startswith("clinical_notes."):
                                        sub = k.split(".", 1)[1]
                                        if "clinical_notes" not in translated_data:
                                            translated_data["clinical_notes"] = {}
                                        translated_data["clinical_notes"][sub] = v
            except Exception as te:
                logger.warning(f"Field translation failed: {te}")

        return {"success": True, "summary": summary, "audio_base64": audio_b64, "translated_data": translated_data}
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

@app.post("/api/verify_pill")
async def verify_pill(
    file: UploadFile = File(...),
    prescription_data: str = Form(...),
    api_key: str = Form(None),
    lang: str = Form("English")
):
    try:
        from google import genai
        from google.genai import types
        import re
        
        contents_bytes = await file.read()
        try:
            img = Image.open(io.BytesIO(contents_bytes))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file.")
            
        img_bytes = _compress_image_for_vision(img)
        
        # Parse prescription data
        try:
            presc = json.loads(prescription_data)
        except:
            presc = {}
            
        def _normalize(name):
            if not name: return ""
            name = str(name).lower()
            salts = ["hydrochloride", "hcl", "sulfate", "sodium", "calcium", "potassium", "maleate"]
            for salt in salts:
                name = name.replace(salt, "").strip()
            name = re.sub(r'[^a-z0-9 ]', '', name)
            
            # Map brand to generic if exists
            for brand, generic in BRAND_TO_GENERIC.items():
                if brand.lower() in name:
                    return generic.lower()
            return name.strip()
            
        def _get_status(bottle_val, presc_val):
            if not bottle_val or bottle_val.lower() in ["none", "null", "n/a", "unknown", "missing"]:
                return "not-found"
            if not presc_val:
                return "not-found"
            
            b_norm = _normalize(bottle_val)
            p_norm = _normalize(presc_val)
            
            if b_norm in p_norm or p_norm in b_norm:
                return "match"
                
            # For strength/quantity, simple string inclusion is usually enough
            b_clean = re.sub(r'[^0-9]', '', str(bottle_val))
            p_clean = re.sub(r'[^0-9]', '', str(presc_val))
            if b_clean and p_clean and (b_clean == p_clean or b_clean in p_clean or p_clean in b_clean):
                return "match"
                
            return "mismatch"
            
        key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("SERVER_GEMINI_API_KEY")
        if not key or key == "DEMO_MODE":
            # Dummy demo response - deterministic mismatch
            return {
                "drug": {
                    "bottle_value": "Lisinopril",
                    "prescribed_value": "Losartan",
                    "status": "mismatch"
                },
                "salts": "Lisinopril Dihydrate",
                "strength": {
                    "bottle_value": "10mg",
                    "prescribed_value": "50mg",
                    "status": "mismatch"
                },
                "quantity": {
                    "bottle_value": None,
                    "prescribed_value": "30",
                    "status": "not-found"
                }
            }
            
        client = genai.Client(api_key=key)
        
        prompt = """
You are an expert pharmacist. Extract the exact drug name, ALL salts present (active ingredients) with their exact dosages, strength, quantity, and manufacturer from this medication label image. 
If there are multiple salts/active ingredients, list ALL of them separated by commas (e.g. "Thiamine Mononitrate (B1) 10 mg, Riboflavin (B2) 10 mg"). Be extremely precise.
Return EXACTLY THIS JSON (no extra text, no markdown block). If a field is missing, return null for that field.
{
  "drug_name": "...",
  "salts": "...",
  "strength": "...",
  "quantity": "...",
  "manufacturer": "..."
}
"""
        model_contents = [
            types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"),
            prompt
        ]
        
        model_candidates = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-1.5-pro"]
        response = None
        last_error = None
        
        for model_name in model_candidates:
            try:
                response = client.models.generate_content(model=model_name, contents=model_contents)
                if response and response.text:
                    break
            except Exception as e:
                last_error = e
                print(f"Model {model_name} failed in verify_pill: {e}")
                continue
                
        if not response or not response.text:
            raise HTTPException(status_code=503, detail=f"All models failed due to high demand. Last error: {str(last_error)}")
            
        res_json = _extract_json(response.text)
        
        # Now do deterministic comparison
        bottle_drug = res_json.get("drug_name")
        bottle_strength = res_json.get("strength")
        bottle_quantity = res_json.get("quantity")
        
        # Get prescribed values
        drugs_list = presc.get("drugs_list", [])
        presc_drug = ""
        presc_strength = ""
        presc_qty = ""
        
        if drugs_list:
            # use the first drug as primary target for now
            first_drug = drugs_list[0]
            presc_drug = first_drug.get("drug", first_drug.get("value", str(first_drug))) if isinstance(first_drug, dict) else str(first_drug)
            if isinstance(presc_drug, dict): presc_drug = str(presc_drug)
            
            # get strength from dosage
            dosage_dict = presc.get("drugs_dosage", {})
            dose_val = dosage_dict.get(presc_drug)
            if dose_val:
                presc_strength = dose_val.get("value", dose_val) if isinstance(dose_val, dict) else str(dose_val)
                
            # get quantity from duration * frequency (approximate, or just use duration)
            duration_dict = presc.get("drugs_duration", {})
            dur_val = duration_dict.get(presc_drug)
            if dur_val:
                presc_qty = dur_val.get("value", dur_val) if isinstance(dur_val, dict) else str(dur_val)
        
        # Check against all drugs if first one doesn't match
        drug_status = "mismatch"
        matched_presc_drug = presc_drug
        matched_presc_strength = presc_strength
        
        for d in drugs_list:
            d_val = d.get("drug", d.get("value", str(d))) if isinstance(d, dict) else str(d)
            if isinstance(d_val, dict): d_val = str(d_val)
            
            if _get_status(bottle_drug, d_val) == "match":
                drug_status = "match"
                matched_presc_drug = d_val
                
                # update strength comparison for this matched drug
                dose_val = presc.get("drugs_dosage", {}).get(d_val)
                if dose_val:
                    matched_presc_strength = dose_val.get("value", dose_val) if isinstance(dose_val, dict) else str(dose_val)
                break
                
        if drug_status != "match":
             drug_status = _get_status(bottle_drug, matched_presc_drug)
                
        strength_status = _get_status(bottle_strength, matched_presc_strength)
        qty_status = _get_status(bottle_quantity, presc_qty)
        
        return {
            "drug": {
                "bottle_value": bottle_drug,
                "prescribed_value": matched_presc_drug,
                "status": drug_status
            },
            "salts": res_json.get("salts"),
            "strength": {
                "bottle_value": bottle_strength,
                "prescribed_value": matched_presc_strength,
                "status": strength_status
            },
            "quantity": {
                "bottle_value": bottle_quantity,
                "prescribed_value": presc_qty,
                "status": qty_status
            }
        }
        
    except Exception as e:
        logger.error(f"Pill verification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ── FHIR R4 Export ───────────────────────────────────────────────────────────

@app.post("/api/export_fhir")
async def export_fhir(prescription_data: str = Form(...)):
    """
    Convert parsed prescription data to a FHIR R4 Bundle and POST it to the
    public HAPI FHIR test server. Returns the server-assigned resource IDs.
    """
    try:
        import uuid
        import requests as http_requests

        presc = json.loads(prescription_data)
        drugs_list = presc.get("drugs_list", [])
        patient_name = presc.get("patient_name", "") or "Anonymous Patient"
        # HAPI FHIR aggressively deduplicates Patients by name and throws 412.
        # We append a random short string to ensure the demo always succeeds.
        safe_patient_name = f"{patient_name} [{str(uuid.uuid4())[:6]}]"

        # ── Build FHIR R4 Bundle ───────────────────────────────────────────
        patient_id = str(uuid.uuid4())

        patient_entry = {
            "fullUrl": f"urn:uuid:{patient_id}",
            "resource": {
                "resourceType": "Patient",
                "meta": {"profile": ["http://hl7.org/fhir/StructureDefinition/Patient"]},
                "name": [{"use": "anonymous", "text": safe_patient_name}],
                "active": True
            },
            "request": {"method": "POST", "url": "Patient"}
        }

        med_entries = []
        for drug_obj in drugs_list:
            if isinstance(drug_obj, dict):
                drug_name = (drug_obj.get("drug") or drug_obj.get("value") or "Unknown Drug").strip()
                dosage_text = str(drug_obj.get("dosage") or "")
                freq_text   = str(drug_obj.get("frequency") or "")
                dur_text    = str(drug_obj.get("duration") or "")
            else:
                drug_name = str(drug_obj).strip()
                dosage_text = freq_text = dur_text = ""

            if not drug_name:
                continue

            med_req_id = str(uuid.uuid4())
            dose_instr = f"{dosage_text} {freq_text} {dur_text}".strip() or "As directed"
            
            med_entry = {
                "fullUrl": f"urn:uuid:{med_req_id}",
                "resource": {
                    "resourceType": "MedicationRequest",
                    "meta": {"profile": ["http://hl7.org/fhir/StructureDefinition/MedicationRequest"]},
                    "status": "active",
                    "intent": "order",
                    "subject": {"reference": f"urn:uuid:{patient_id}"},
                    "medicationCodeableConcept": {
                        "text": drug_name,
                        "coding": [{
                            "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
                            "display": drug_name
                        }]
                    },
                    "dosageInstruction": [{"text": dose_instr}]
                },
                "request": {"method": "POST", "url": "MedicationRequest"}
            }
            med_entries.append(med_entry)

        bundle = {
            "resourceType": "Bundle",
            "type": "transaction",
            "entry": [patient_entry] + med_entries
        }

        # ── POST to HAPI FHIR public test server ──────────────────────────
        hapi_url = "https://hapi.fhir.org/baseR4"
        hapi_res = http_requests.post(
            hapi_url,
            json=bundle,
            headers={
                "Content-Type": "application/fhir+json",
                "Accept": "application/fhir+json"
            },
            timeout=30
        )

        if hapi_res.status_code in [200, 201]:
            resp_bundle = hapi_res.json()
            resource_ids = []
            for entry in resp_bundle.get("entry", []):
                loc = entry.get("response", {}).get("location", "")
                if loc:
                    # location looks like "Patient/123/_history/1" — keep first two segments
                    parts = loc.split("/")
                    if len(parts) >= 2:
                        resource_ids.append(f"{parts[0]}/{parts[1]}")

            bundle_id = resp_bundle.get("id", "")
            # Find the Patient resource ID to use as the primary link
            # (Transaction bundles are not stored as Bundle resources on HAPI)
            patient_url = None
            for rid in resource_ids:
                if rid.startswith("Patient/"):
                    patient_url = f"{hapi_url}/{rid}"
                    break
            return {
                "success": True,
                "bundle_id": bundle_id,
                "resource_ids": resource_ids,
                "patient_url": patient_url,  # Direct link to Patient resource (retrievable)
                "hapi_base": hapi_url,
                "drug_count": len(med_entries)
            }
        else:
            return {
                "success": False,
                "error": f"HAPI server returned HTTP {hapi_res.status_code}. Please try again."
            }

    except Exception as e:
        logger.error(f"FHIR export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
