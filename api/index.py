"""
RxLens — Vercel Serverless Entry Point
=======================================
Vercel runs Python serverless functions with strict constraints.
This backend features:
1. Global Cloud Caching (Firestore REST)
2. Lightweight OCR Pipeline (OCR.Space)
3. Model Cascading (gemini-2.0-flash -> gemini-1.5-flash -> gemini-1.5-flash-8b)
4. Inline Clinical Safety Engine
"""

import os
import sys
import json
import io
import re
import logging
import hashlib
import base64
import requests

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

PROJECT_ID = "rxlens-pilot"
FIRESTORE_BASE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"
OCR_API_KEY = "helloworld"  # OCR.Space free tier key

# ── Demo fallback data (used when all cascades fail) ────────────────────────
DEMO_DATA = {
    "drug": "Dolo 650 (Paracetamol)",
    "drugs_list": ["Dolo 650", "Paracetamol"],
    "drugs_dosage": {"Dolo 650": "650mg"},
    "dosage": "650mg",
    "frequency": "Three times a day (TDS)",
    "duration": "5 days",
    "instructions": "Take after meals with water.",
    "notes": "Stay hydrated. Safe for adults.",
    "side_effects": ["Nausea", "Allergic skin rash (rare)"],
    "precautions": ["Avoid alcohol."],
    "schedule": [
        {"time": "08:00 AM", "task": "Take 1 tablet after breakfast"},
        {"time": "02:00 PM", "task": "Take 1 tablet after lunch"},
        {"time": "08:00 PM", "task": "Take 1 tablet after dinner"},
    ],
    "confidence": {"drug": 0.98},
    "overall_confidence": 0.95,
    "uncertainty_warnings": [],
    "is_uncertain": False,
    "accessibility_analysis": {
        "score": "Medium",
        "jargon_density": "Low",
        "readability": "6th Grade Level",
        "reason": "Simple medication.",
    },
    "confusing_terms": [],
    "safety_alerts": [],
    "polypharmacy_notes": [],
    "environmental": {},
    "is_demo_fallback": True,
    "_pipeline": "demo",
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
    drug = data.get("drug", "Unknown medication")
    dosage = data.get("dosage", "")
    freq = data.get("frequency", "as directed")
    instructions = data.get("instructions", "")
    parts = [f"Medication: {drug}"]
    if dosage: parts.append(f"Dosage: {dosage}")
    if freq: parts.append(f"Frequency: {freq}")
    if instructions: parts.append(f"Instructions: {instructions}")
    return ". ".join(parts) + "."

# ── Firestore Caching ────────────────────────────────────────────────────────

def get_cache(text_hash: str) -> dict | None:
    try:
        url = f"{FIRESTORE_BASE_URL}/caches/{text_hash}"
        res = requests.get(url, timeout=3)
        if res.status_code == 200:
            doc = res.json()
            if "fields" in doc and "payload" in doc["fields"]:
                json_str = doc["fields"]["payload"].get("stringValue", "")
                if json_str:
                    data = json.loads(json_str)
                    data["_pipeline"] = "cache_hit"
                    return data
    except Exception as e:
        logger.warning(f"Cache read failed: {e}")
    return None

def set_cache(text_hash: str, payload: dict) -> None:
    try:
        url = f"{FIRESTORE_BASE_URL}/caches/{text_hash}"
        doc = {
            "fields": {
                "payload": {"stringValue": json.dumps(payload)}
            }
        }
        requests.patch(url, json=doc, timeout=3)
    except Exception as e:
        logger.warning(f"Cache write failed: {e}")

# ── OCR Pipeline ─────────────────────────────────────────────────────────────

def _compress_image_for_ocr(img: Image.Image) -> bytes:
    """Resize to max 1280px and compress to fit OCR.Space 1MB limit."""
    img = img.copy()
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    max_dim = 1280
    if max(img.width, img.height) > max_dim:
        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
    
    buf = io.BytesIO()
    quality = 85
    img.save(buf, format="JPEG", quality=quality)
    while buf.tell() > 1000000 and quality > 30:
        buf.seek(0)
        buf.truncate()
        quality -= 10
        img.save(buf, format="JPEG", quality=quality)
    return buf.getvalue()

def extract_text_ocr_space(img_bytes: bytes, lang: str) -> str:
    lang_map = {"English": "eng", "Hindi": "hin", "Spanish": "spa"}
    ocr_lang = lang_map.get(lang, "eng")
    
    try:
        res = requests.post(
            "https://api.ocr.space/parse/image",
            files={"image": ("scan.jpg", img_bytes, "image/jpeg")},
            data={"apikey": OCR_API_KEY, "language": ocr_lang, "OCREngine": 2},
            timeout=15
        )
        data = res.json()
        if not data.get("IsErroredOnProcessing") and data.get("ParsedResults"):
            return data["ParsedResults"][0].get("ParsedText", "").strip()
    except Exception as e:
        logger.warning(f"OCR.Space failed: {e}")
    return ""

# ── Safety Engine ────────────────────────────────────────────────────────────

KNOWN_INTERACTIONS = {
    frozenset(["warfarin", "aspirin"]): "Increased bleeding risk — both thin blood.",
    frozenset(["metformin", "alcohol"]): "Severe lactic acidosis risk.",
    frozenset(["ssri", "tramadol"]): "Serotonin syndrome risk.",
}
HIGH_RISK_KEYWORDS = ["warfarin", "lithium", "digoxin", "methotrexate", "phenytoin"]

def _run_safety(drugs_list: list, patient_profile: dict | None) -> dict:
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

def _call_gemini_cascading(text: str, img_bytes: bytes, api_key: str, lang: str, explanation_level: str, patient_profile: dict | None) -> dict:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    level_instruction = LEVEL_HINTS.get(explanation_level, "Use clear, plain language.")
    profile_ctx = f"\nPatient Profile: {json.dumps(patient_profile)}" if patient_profile else ""
    
    prompt = f"""
You are a clinical AI assistant. Analyze this prescription and return structured JSON in {lang}.
{profile_ctx}
EXPLANATION STYLE: {level_instruction}

If raw OCR text is provided below, use it as the primary source of truth.
RAW TEXT:
{text or 'None'}

INSTRUCTIONS:
1. Extract ALL medications.
2. Build a 'schedule' array with time-labelled doses.
3. ALL text values MUST be in {lang}.

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
  "schedule": [{{"time": "08:00 AM", "task": "description"}}],
  "confidence": {{"drug": 0.9}},
  "overall_confidence": 0.9,
  "is_uncertain": false,
  "accessibility_analysis": {{"score": "Medium", "jargon_density": "Low", "readability": "6th Grade Level", "reason": ""}}
}}
"""
    
    # Use vision if OCR failed (text is empty), else use text-only (much cheaper and higher rate limit)
    contents = [prompt]
    if not text:
        contents.insert(0, types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"))

    # Model Cascade
    models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest", "gemini-2.0-flash-lite"]
    last_err = None

    for model in models:
        try:
            logger.info(f"Attempting {model}...")
            response = client.models.generate_content(model=model, contents=contents)
            if response.text:
                res_json = _extract_json(response.text)
                res_json["_pipeline"] = f"llm_{model}"
                return res_json
        except Exception as e:
            err_msg = str(e)
            logger.warning(f"{model} failed: {err_msg}")
            last_err = e
            # Continue cascade on Quota errors, 404s, or 400s (model not found/supported)
            if not any(k in err_msg for k in ["429", "RESOURCE_EXHAUSTED", "quota", "Quota", "404", "NOT_FOUND", "400"]):
                raise e

    raise last_err

# ── API Routes ───────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "RxLens Scalable API running", "version": "3.0-vercel"}

@app.get("/api/config")
def get_config():
    return {"api_key_configured": bool(os.getenv("GEMINI_API_KEY"))}

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

        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key or key == "DEMO_MODE":
            return {"success": True, "data": dict(DEMO_DATA), "summary": _make_summary(DEMO_DATA)}

        # 1. OCR (Lightweight)
        img_bytes = _compress_image_for_ocr(img)
        extracted_text = extract_text_ocr_space(img_bytes, lang)
        
        # 2. Caching
        text_hash = hashlib.md5(f"{extracted_text}_{lang}_{explanation_level}".encode()).hexdigest()
        if extracted_text and len(extracted_text) > 10:
            cached = get_cache(text_hash)
            if cached:
                logger.info("Cache Hit!")
                summary = _make_summary(cached, lang)
                return {"success": True, "data": cached, "summary": summary}

        # 3. LLM Processing with Cascading
        try:
            parsed = _call_gemini_cascading(extracted_text, img_bytes, key, lang, explanation_level, profile_data)
            parsed = _normalize(parsed)
            if "overall_confidence" not in parsed:
                scores = [v for v in parsed.get("confidence", {}).values() if isinstance(v, (int, float))]
                parsed["overall_confidence"] = round(sum(scores)/len(scores), 2) if scores else None
        except Exception as e:
            err = str(e)
            if any(k in err for k in ["429", "RESOURCE_EXHAUSTED", "quota"]):
                raise HTTPException(status_code=429, detail="All AI models hit rate limit. Try entering a custom API key in Settings.")
            raise HTTPException(status_code=500, detail=f"AI Engine Error: {err}")

        # 4. Run Safety & Finalize
        drugs = parsed.get("drugs_list", [])
        safety = _run_safety(drugs, profile_data)
        parsed["safety_alerts"] = safety["alerts"]
        parsed["polypharmacy_notes"] = safety["polypharmacy_notes"]
        
        # Save to Cache
        if extracted_text and len(extracted_text) > 10:
            set_cache(text_hash, parsed)

        summary = _make_summary(parsed, lang)
        return {"success": True, "data": parsed, "summary": summary}

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
        prompt = f"You are a clinical assistant.\nContext: {context}\nUser: {question}\nRespond in {lang}."
        res = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        return {"answer": res.text or "I'm not sure."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
