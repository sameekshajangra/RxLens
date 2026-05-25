"""
RxLens — Vercel Serverless Entry Point
=======================================
Vercel runs Python serverless functions with strict constraints:
- No persistent filesystem
- No subprocess / system installs (no Tesseract, no gTTS)
- Packages from requirements.txt only

This file is a self-contained FastAPI app that works within those limits.
It uses Gemini vision directly (no local OCR) and skips audio/PDF features
that require the filesystem. The full feature set runs on the local backend.
"""

import os
import sys
import json
import io
import re
import logging

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

# ── Add project root to path ────────────────────────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="RxLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Demo fallback data (used when Gemini quota is exhausted) ─────────────────
DEMO_DATA = {
    "drug": "Dolo 650 (Paracetamol)",
    "drugs_list": ["Dolo 650", "Paracetamol"],
    "drugs_dosage": {"Dolo 650": "650mg"},
    "dosage": "650mg",
    "frequency": "Three times a day (TDS)",
    "duration": "5 days",
    "instructions": "Take after meals with water. Do not exceed 4g in 24 hours.",
    "notes": "Stay hydrated. Safe for adults.",
    "side_effects": ["Nausea", "Allergic skin rash (rare)", "Liver stress if overdosed"],
    "precautions": ["Avoid alcohol. Consult doctor if you have liver or kidney disease."],
    "schedule": [
        {"time": "08:00 AM", "task": "Take 1 tablet after breakfast"},
        {"time": "02:00 PM", "task": "Take 1 tablet after lunch"},
        {"time": "08:00 PM", "task": "Take 1 tablet after dinner"},
    ],
    "confidence": {"drug": 0.98, "dosage": 0.95, "frequency": 0.92},
    "overall_confidence": 0.95,
    "uncertainty_warnings": [],
    "is_uncertain": False,
    "accessibility_analysis": {
        "score": "Medium",
        "jargon_density": "Low",
        "readability": "6th Grade Level",
        "reason": "Simple medication with clear instructions.",
    },
    "confusing_terms": [
        {"term": "TDS", "simplified": "Three times a day (Morning, Afternoon, Night)"}
    ],
    "safety_alerts": [],
    "polypharmacy_notes": [],
    "environmental": {},
    "explainability_sources": {
        "instructions": "Dolo 650",
        "side_effects": ["Dolo 650"],
        "precautions": ["Dolo 650"],
    },
    "is_demo_fallback": True,
    "_pipeline": "demo",
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _extract_json(text: str) -> dict:
    """Extract the first JSON object from a potentially messy LLM response."""
    text = text.strip()
    # Try code-fenced JSON block first
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
    # Raw JSON object
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end + 1])
        except Exception:
            pass
    raise ValueError("No valid JSON found in LLM response")


def _normalize(data: dict) -> dict:
    """Ensure every expected field exists with a safe default."""
    defaults = {
        "drugs_list": [], "safety_alerts": [], "schedule": [],
        "uncertainty_warnings": [], "confusing_terms": [],
        "polypharmacy_notes": [], "side_effects": [], "precautions": [],
        "confidence": {}, "is_uncertain": False, "is_demo_fallback": False,
    }
    return {**defaults, **data}


def _make_summary(data: dict, lang: str = "English") -> str:
    drug = data.get("drug", "Unknown medication")
    dosage = data.get("dosage", "")
    freq = data.get("frequency", "as directed")
    duration = data.get("duration", "")
    instructions = data.get("instructions", "")
    parts = [f"Medication: {drug}"]
    if dosage:
        parts.append(f"Dosage: {dosage}")
    if freq:
        parts.append(f"Frequency: {freq}")
    if duration:
        parts.append(f"Duration: {duration}")
    if instructions:
        parts.append(f"Instructions: {instructions}")
    return ". ".join(parts) + "."


# ── Safety engine (lightweight inline version for Vercel) ────────────────────

KNOWN_INTERACTIONS = {
    frozenset(["warfarin", "aspirin"]): "Increased bleeding risk — both thin blood.",
    frozenset(["metformin", "alcohol"]): "Severe lactic acidosis risk.",
    frozenset(["ssri", "tramadol"]): "Serotonin syndrome risk.",
    frozenset(["ace inhibitor", "potassium"]): "Hyperkalemia risk.",
}

HIGH_RISK_KEYWORDS = ["warfarin", "lithium", "digoxin", "methotrexate", "phenytoin"]


def _run_safety(drugs_list: list, patient_profile: dict | None) -> dict:
    alerts = []
    lower_drugs = [d.lower() for d in drugs_list]

    # Check known drug interactions
    for pair, message in KNOWN_INTERACTIONS.items():
        pair_lower = {p.lower() for p in pair}
        if all(any(p in d for d in lower_drugs) for p in pair_lower):
            alerts.append({
                "severity": "Critical",
                "message": message,
                "drugs": list(pair),
            })

    # High-risk drug warnings
    for drug in lower_drugs:
        for risky in HIGH_RISK_KEYWORDS:
            if risky in drug:
                alerts.append({
                    "severity": "Warning",
                    "message": f"{drug.title()} requires regular monitoring. Follow-up with doctor.",
                    "drugs": [drug],
                })

    # Patient profile checks
    if patient_profile:
        allergies = [a.lower() for a in (patient_profile.get("allergies") or [])]
        for drug in lower_drugs:
            for allergen in allergies:
                if allergen and allergen in drug:
                    alerts.append({
                        "severity": "Critical",
                        "message": f"⚠️ Possible allergy: {drug.title()} matches known allergen '{allergen}'.",
                        "drugs": [drug],
                    })

    return {
        "alerts": alerts,
        "polypharmacy_notes": (
            [f"You are taking {len(drugs_list)} medications — review with your doctor."]
            if len(drugs_list) >= 4 else []
        ),
        "environmental": {},
    }


# ── Gemini call ──────────────────────────────────────────────────────────────

LEVEL_HINTS = {
    "simple": (
        "Use Grade-4 reading level. No medical jargon. Very short sentences. "
        "Explain as if to an elderly person or someone who cannot read well."
    ),
    "detailed": (
        "Provide full clinical depth: pharmacological class, mechanism, contraindications, "
        "clinically relevant interactions, and monitoring parameters. For healthcare professionals."
    ),
}


def _call_gemini(image: Image.Image, api_key: str, lang: str, explanation_level: str, patient_profile: dict | None) -> dict:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)

    level_instruction = LEVEL_HINTS.get(
        explanation_level,
        "Use clear, plain language suitable for a general adult patient."
    )
    profile_ctx = f"\nPatient Profile: {json.dumps(patient_profile)}" if patient_profile else ""

    prompt = f"""
You are a clinical AI assistant. Analyse this prescription image and return structured JSON in {lang}.
{profile_ctx}
EXPLANATION STYLE: {level_instruction}

INSTRUCTIONS:
1. Extract ALL medications (brand and generic names).
2. Build a 'schedule' array with time-labelled doses (Morning, Afternoon, Evening, Night).
3. Flag unusual dosages. Rate your confidence 0.0-1.0 per field.
4. ALL text values (drug names, tasks, instructions) MUST be in {lang}.

RETURN EXACTLY THIS JSON (no extra text):
{{
  "drug": "all medications comma-separated",
  "drugs_list": ["Drug 1", "Drug 2"],
  "drugs_dosage": {{"Drug 1": "Dose 1"}},
  "dosage": "dosage summary",
  "frequency": "frequency summary",
  "duration": "total duration",
  "instructions": "intake instructions",
  "notes": "patient notes",
  "side_effects": ["Effect 1"],
  "precautions": ["Precaution 1"],
  "schedule": [
    {{"time": "HH:MM AM/PM", "task": "description in {lang}"}}
  ],
  "confidence": {{"drug": 0.9, "dosage": 0.9, "frequency": 0.9}},
  "overall_confidence": 0.9,
  "is_uncertain": false,
  "accessibility_analysis": {{
    "score": "Easy|Medium|Difficult",
    "jargon_density": "Low|Medium|High",
    "readability": "Grade level",
    "reason": "brief reason"
  }},
  "confusing_terms": [
    {{"term": "TDS", "simplified": "Three times a day"}}
  ],
  "explainability_sources": {{
    "instructions": "Drug Name",
    "side_effects": ["Drug 1"],
    "precautions": ["Drug 1"]
  }}
}}
"""

    # Convert image to bytes
    buf = io.BytesIO()
    image.convert("RGB").save(buf, format="PNG")
    img_bytes = buf.getvalue()

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            types.Part.from_bytes(data=img_bytes, mime_type="image/png"),
            prompt,
        ],
    )

    if not response.text:
        raise ValueError("Empty response from Gemini")

    return _extract_json(response.text)


# ── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "RxLens API running", "version": "2.0-vercel"}


@app.get("/api/config")
def get_config():
    return {"api_key_configured": bool(os.getenv("GEMINI_API_KEY"))}


@app.get("/api/history")
def get_history():
    return []  # No persistent DB in serverless


@app.post("/api/extract")
async def extract_prescription(
    file: UploadFile = File(...),
    api_key: str = Form(None),
    lang: str = Form("English"),
    patient_profile: str = Form(None),
    explanation_level: str = Form("standard"),
):
    try:
        # Read and open image
        contents = await file.read()
        try:
            img = Image.open(io.BytesIO(contents))
            if img.mode not in ("RGB", "L"):
                img = img.convert("RGB")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid image file. Please upload a JPEG or PNG.")

        # Parse patient profile
        profile_data = None
        if patient_profile:
            try:
                profile_data = json.loads(patient_profile)
            except Exception:
                pass

        # Resolve API key (from form or env)
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key or key == "DEMO_MODE":
            logger.info("No API key — returning demo fallback")
            parsed = dict(DEMO_DATA)
        else:
            try:
                parsed = _call_gemini(img, key, lang, explanation_level, profile_data)
                parsed = _normalize(parsed)
                # Compute overall confidence if missing
                if "overall_confidence" not in parsed:
                    conf = parsed.get("confidence", {})
                    scores = [v for v in conf.values() if isinstance(v, (int, float))]
                    parsed["overall_confidence"] = round(sum(scores) / len(scores), 2) if scores else None
            except Exception as e:
                err = str(e)
                logger.warning("Gemini call failed: %s", err)
                if any(k in err for k in ["429", "RESOURCE_EXHAUSTED", "quota", "Quota"]):
                    raise HTTPException(status_code=429, detail="AI quota reached. Please wait 30 seconds and try again.")
                if any(k in err for k in ["No valid JSON", "Empty response"]):
                    logger.info("JSON parse failed — using demo fallback")
                    parsed = dict(DEMO_DATA)
                else:
                    raise HTTPException(status_code=500, detail=f"AI Engine Error: {err}")

        # Run lightweight safety engine
        drugs = parsed.get("drugs_list", [])
        if not drugs and parsed.get("drug"):
            drugs = [d.strip() for d in parsed["drug"].split(",") if d.strip()]

        safety = _run_safety(drugs, profile_data)
        parsed["safety_alerts"] = safety["alerts"]
        parsed["polypharmacy_notes"] = safety["polypharmacy_notes"]
        parsed["environmental"] = safety["environmental"]
        parsed["uncertainty_warnings"] = parsed.get("uncertainty_warnings", [])

        summary = _make_summary(parsed, lang)

        return {
            "success": True,
            "data": parsed,
            "summary": summary,
            "audio_url": None,  # No audio in serverless
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unexpected error: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
async def chat(
    question: str = Form(...),
    context: str = Form(""),
    lang: str = Form("English"),
    api_key: str = Form(None),
):
    try:
        from google import genai
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            return {"answer": "Please enter your Gemini API key to use the chat assistant."}

        client = genai.Client(api_key=key)
        prompt = f"You are a clinical pharmacist assistant.\nContext: {context}\nUser question: {question}\nRespond clearly in {lang}."
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return {"answer": response.text or "I'm not sure. Please consult your pharmacist."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pdf")
async def pdf_placeholder():
    raise HTTPException(status_code=501, detail="PDF generation requires the local backend.")


@app.get("/api/audio/{filename}")
async def audio_placeholder(filename: str):
    raise HTTPException(status_code=501, detail="Audio requires the local backend.")
