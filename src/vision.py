"""
RxLens Vision / LLM Layer — Split Pipeline
============================================
Architecture:
  Image → OCR (cheap, fast) → raw text
                                   ↓
                            Gemini text-only prompt  ← cache lookup first
                                   ↓
                           JSON structured output
                                   ↓
                        Rule-based Safety Engine

If OCR returns None (unclear image), we fall back to the original
full Gemini Vision call (image bytes → Gemini multimodal) to maintain
100% backwards compatibility.
"""

import os
import re
import io
import json
import logging
from PIL import Image
from dotenv import load_dotenv
from src.safety_engine import analyze_safety
from src.ocr import extract_text_from_image
from src.cache import get_cached, set_cache

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────
# Shared helpers (unchanged from original)
# ─────────────────────────────────────────────────────────────────────

def preprocess_image(image):
    try:
        if isinstance(image, Image.Image):
            return image.convert('L')
    except Exception:
        pass
    return image


def compute_overall_confidence(confidence_data):
    if not confidence_data or not isinstance(confidence_data, dict):
        return 0.0
    scores = []
    for key, val in confidence_data.items():
        if isinstance(val, (int, float)):
            scores.append(float(val))
        elif isinstance(val, dict) and "score" in val:
            scores.append(float(val["score"]))
    return round(sum(scores) / len(scores), 2) if scores else 0.0


def generate_uncertainty_warnings(parsed_data, lang='English'):
    warnings = []
    confidence = parsed_data.get("confidence", {})
    if not confidence:
        return warnings

    thresholds = {"low": 0.6, "medium": 0.8}
    field_labels = {
        "drug": "medication name",
        "dosage": "dosage information",
        "frequency": "frequency/timing",
        "duration": "treatment duration",
        "overall": "overall reading"
    }

    for field, score in confidence.items():
        if isinstance(score, dict):
            score = score.get("score", 1.0)
        score = float(score)
        label = field_labels.get(field, field)

        if score < thresholds["low"]:
            warnings.append({
                "field": field, "score": score, "level": "low",
                "message": f"Low confidence ({int(score*100)}%) detected for {label}. Please verify with your pharmacist.",
                "action": "Verify with pharmacist before use"
            })
        elif score < thresholds["medium"]:
            warnings.append({
                "field": field, "score": score, "level": "medium",
                "message": f"Moderate confidence ({int(score*100)}%) for {label}. Double-check this value.",
                "action": "Double-check recommended"
            })
    return warnings


def _extract_json_from_text(text):
    text = text.strip()
    if "```" in text:
        parts = text.split("```")
        for part in parts[1::2]:
            cleaned = part.strip()
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()
            if cleaned.startswith("{"):
                return cleaned
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text


# ─────────────────────────────────────────────────────────────────────
# Prompt builder (explanation_level aware)
# ─────────────────────────────────────────────────────────────────────

def _build_text_prompt(raw_text: str, lang: str, explanation_level: str, patient_profile: dict | None) -> str:
    """Build a text-only Gemini prompt from OCR-extracted text."""
    profile_context = f"Patient Profile: {json.dumps(patient_profile)}" if patient_profile else ""

    level_instruction = {
        "simple": (
            "Use very simple, everyday language (Grade 4 reading level). "
            "Avoid ALL medical jargon. Use short sentences. Think of explaining to an elderly person or someone with low literacy."
        ),
        "detailed": (
            "Provide full clinical depth. Include pharmacological class, mechanism notes, "
            "contraindications, clinically relevant drug interactions, and monitoring parameters. "
            "Target audience: healthcare professionals."
        ),
    }.get(explanation_level, "Use clear, plain language suitable for a general adult patient.")

    return f"""
You are a clinical AI assistant. A prescription document has been scanned via OCR.
The raw OCR text is below. Parse it carefully and return structured JSON.

{profile_context}

OCR TEXT:
\"\"\"
{raw_text}
\"\"\"

EXPLANATION STYLE: {level_instruction}

INSTRUCTIONS:
1. EXTRACT DRUGS: List ALL medications with brand and generic names.
2. DOSAGE RED FLAGS: Flag unusually high or low dosages.
3. SCHEDULE: Create a 'schedule' array with Morning, Afternoon, Evening, Night slots.
4. For each drug, provide dosage in drugs_dosage map.
5. ALL values in the JSON (drug names, instructions, tasks, frequency) MUST be in {lang}.

CONFIDENCE SCORING: Rate your confidence 0.0–1.0 per field based on OCR clarity.

ACCESSIBILITY: Identify complex medical terms and simplify them in 'confusing_terms'.

RETURN EXACTLY THIS JSON:
{{
    "drug": "all medications separated by commas",
    "drugs_list": ["Drug 1", "Drug 2"],
    "drugs_dosage": {{"Drug 1": "Dosage 1"}},
    "dosage": "summary of dosages",
    "frequency": "summary",
    "duration": "total duration",
    "instructions": "intake instructions",
    "notes": "patient notes",
    "side_effects": ["Effect 1"],
    "precautions": ["Precaution 1"],
    "schedule": [
        {{"time": "HH:MM AM/PM", "task": "action in {lang}"}}
    ],
    "confidence": {{
        "drug": 0.0,
        "dosage": 0.0,
        "frequency": 0.0
    }},
    "accessibility_analysis": {{
        "score": "Easy|Medium|Difficult",
        "jargon_density": "Low|Medium|High",
        "readability": "e.g. 6th Grade Level",
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


def _build_vision_prompt(lang: str, explanation_level: str, patient_profile: dict | None) -> str:
    """Original full-image prompt (fallback when OCR fails)."""
    profile_context = f"Patient Profile: {json.dumps(patient_profile)}" if patient_profile else ""
    level_instruction = {
        "simple": "Use very simple everyday language. No medical jargon.",
        "detailed": "Provide full clinical depth suitable for healthcare professionals.",
    }.get(explanation_level, "Use clear plain language for a general adult patient.")

    return f"""
    Digitize this prescription into JSON in {lang}.
    {profile_context}
    EXPLANATION STYLE: {level_instruction}

    CRITICAL INSTRUCTIONS:
    1. EXTRACT DRUGS: List ALL medications — include brand names AND generic names.
    2. DOSAGE RED FLAGS: Flag unusually high or low dosages.
    3. SCHEDULE: Create a 'schedule' array with Morning, Afternoon, Evening, Night slots.
    4. For each drug, provide dosage in drugs_dosage map.
    5. TRANSLATION: Ensure ALL values in the JSON are in {lang}.

    CONFIDENCE SCORING: Rate 0.0–1.0 per field.

    RETURN A JSON OBJECT IN THIS EXACT FORMAT:
    {{
        "drug": "List all medications found, separated by commas",
        "drugs_list": ["Drug 1", "Drug 2"],
        "drugs_dosage": {{"Drug 1": "Dosage 1", "Drug 2": "Dosage 2"}},
        "dosage": "Summary of dosages",
        "frequency": "Summary of frequencies",
        "duration": "Total duration",
        "instructions": "Specific intake instructions",
        "notes": "General patient instructions",
        "side_effects": ["Effect 1"],
        "precautions": ["Precaution 1"],
        "schedule": [
            {{"time": "HH:MM AM/PM", "task": "Action description in {lang}"}}
        ],
        "confidence": {{
            "drug": 0.0,
            "dosage": 0.0,
            "frequency": 0.0
        }},
        "accessibility_analysis": {{
            "score": "Easy|Medium|Difficult",
            "jargon_density": "Low|Medium|High",
            "readability": "e.g., 6th Grade Level",
            "reason": "Why this score"
        }},
        "confusing_terms": [
            {{"term": "TDS", "simplified": "Take 3 times a day"}}
        ],
        "explainability_sources": {{
            "instructions": "Medication Name",
            "side_effects": ["Medication Name 1"],
            "precautions": ["Medication Name 1"]
        }}
    }}
    CRITICAL: If the image is blurry, infer the most likely drug name from partial characters.
    """


# ─────────────────────────────────────────────────────────────────────
# Demo fallback (unchanged)
# ─────────────────────────────────────────────────────────────────────

_DEMO_RESPONSE = {
    "drug": "Dolo 650 (Paracetamol)",
    "drugs_list": ["Dolo 650", "Paracetamol"],
    "drugs_dosage": {"Dolo 650": "650mg"},
    "dosage": "650mg",
    "frequency": "Three times a day (TDS)",
    "duration": "5 days",
    "instructions": "Take after meals with water. Do not exceed 4g in 24 hours.",
    "notes": "Ensure patient stays hydrated. Safe for adults.",
    "side_effects": ["Nausea", "Allergic skin rash", "Liver damage (if overdosed)"],
    "precautions": ["Avoid alcohol. Consult doctor if you have liver or kidney disease."],
    "schedule": [
        {"time": "08:00 AM", "task": "Take 1 tab after breakfast"},
        {"time": "02:00 PM", "task": "Take 1 tab after lunch"},
        {"time": "08:00 PM", "task": "Take 1 tab after dinner"}
    ],
    "confidence": {"drug": 0.98, "dosage": 0.95, "frequency": 0.92},
    "accessibility_analysis": {
        "score": "Medium", "jargon_density": "Medium",
        "readability": "6th Grade Level",
        "reason": "Contains simple abbreviations like TDS but is overall easy to follow."
    },
    "confusing_terms": [
        {"term": "TDS", "simplified": "Three times a day (usually Morning, Afternoon, and Night)"}
    ],
    "explainability_sources": {
        "instructions": "Dolo 650",
        "side_effects": ["Dolo 650"],
        "precautions": ["Dolo 650"]
    },
    "is_demo_fallback": True
}


# ─────────────────────────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────────────────────────

def analyze_prescription_vision(
    image, api_key=None, lang='English',
    patient_profile=None, explanation_level='standard',
    past_medications=None
):
    """
    Split pipeline:
      1. Try cheap OCR first → text
      2. Check cache (drug → explanation already computed?)
      3. Send text-only prompt to Gemini (or vision fallback if OCR failed)
      4. Store result in cache
      5. Run deterministic Safety Engine
    """
    from google import genai
    from google.genai import types

    load_dotenv(override=True)
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("API Key missing.")

    client = genai.Client(api_key=key)

    # ── Step 1: Lightweight OCR ──────────────────────────────────────
    raw_text = extract_text_from_image(image)
    ocr_succeeded = raw_text is not None
    logger.info("OCR succeeded: %s (%d chars)", ocr_succeeded, len(raw_text or ""))


    # ── Model cascade helper ───────────────────────────────────────────
    MODELS = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-2.0-flash-lite",
    ]
    RETRYABLE_ERRORS = ["429", "RESOURCE_EXHAUSTED", "quota", "Quota",
                        "503", "UNAVAILABLE", "500", "404", "NOT_FOUND", "400"]

    def _call_with_cascade(contents):
        """Try each model in order, falling back on transient errors."""
        last_err = None
        for model in MODELS:
            try:
                logger.info("Trying model: %s", model)
                resp = client.models.generate_content(model=model, contents=contents)
                if resp.text:
                    return resp.text
            except Exception as exc:
                err_str = str(exc)
                logger.warning("%s failed: %s", model, err_str)
                last_err = exc
                if not any(k in err_str for k in RETRYABLE_ERRORS):
                    raise exc  # non-transient — bail immediately
        raise last_err  # all models exhausted

    try:
        if ocr_succeeded:
            # ── Step 2: Cache lookup ─────────────────────────────────
            import hashlib
            text_key = hashlib.sha256(raw_text.encode()).hexdigest()[:16]
            cached = get_cached(text_key, explanation_level, lang)
            if cached:
                logger.info("Full prescription cache HIT")
                parsed_data = cached
            else:
                # ── Step 3a: Text-only Gemini call ───────────────────
                prompt = _build_text_prompt(raw_text, lang, explanation_level, patient_profile)
                text_response = _call_with_cascade(prompt)

                json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
                if json_match:
                    parsed_data = json.loads(json_match.group(0))
                else:
                    clean = text_response.replace("```json", "").replace("```", "").strip()
                    parsed_data = json.loads(clean)

                # ── Step 4: Store in cache ────────────────────────────
                set_cache(text_key, parsed_data, explanation_level, lang)

        else:
            # ── Step 3b: Vision fallback (original behaviour) ────────
            logger.info("Using Gemini Vision fallback (full image)")
            processed_pil = preprocess_image(image)
            img_byte_arr = io.BytesIO()
            processed_pil.save(img_byte_arr, format='PNG')
            img_bytes = img_byte_arr.getvalue()

            prompt = _build_vision_prompt(lang, explanation_level, patient_profile)
            vis_response = _call_with_cascade([
                types.Part.from_bytes(data=img_bytes, mime_type="image/png"),
                prompt
            ])

            json_match = re.search(r'\{.*\}', vis_response, re.DOTALL)
            if json_match:
                parsed_data = json.loads(json_match.group(0))
            else:
                clean = vis_response.replace("```json", "").replace("```", "").strip()
                parsed_data = json.loads(clean)

    except Exception as e:
        error_msg = str(e)
        logger.error("Vision/LLM error: %s", error_msg)
        # On any quota, overload, or parse error — show demo mode rather than crash
        if any(k in error_msg for k in ["429", "RESOURCE_EXHAUSTED", "limit", "503", "UNAVAILABLE", "Expecting value"]):
            logger.info("FALLBACK: Demo mode")
            parsed_data = _DEMO_RESPONSE.copy()
        else:
            raise e


    # ── Confidence & uncertainty post-processing ────────────────────
    confidence = parsed_data.get("confidence", {})
    parsed_data["overall_confidence"] = compute_overall_confidence(confidence) if confidence else None
    if not confidence:
        parsed_data["confidence"] = {}

    parsed_data["uncertainty_warnings"] = generate_uncertainty_warnings(parsed_data, lang)
    parsed_data.setdefault("uncertain_fields", [])

    overall_conf = parsed_data.get("overall_confidence", 1.0)
    is_uncertain = not parsed_data.get("drugs_list") or (overall_conf is not None and overall_conf < 0.50)
    if is_uncertain:
        parsed_data["drug"] = "Unable to confidently identify this medicine."
    parsed_data["is_uncertain"] = is_uncertain

    # Add pipeline metadata (useful for debugging/NGO reporting)
    parsed_data["_pipeline"] = "ocr+llm" if ocr_succeeded else "vision-llm"

    # ── Rule-based Safety Engine ────────────────────────────────────
    extracted_drugs = parsed_data.get("drugs_list", [])
    if not extracted_drugs and parsed_data.get("drug"):
        extracted_drugs = [d.strip() for d in parsed_data["drug"].split(",") if d.strip()]

    dosage_info = parsed_data.get("drugs_dosage", {})
    safety_data = analyze_safety(extracted_drugs, patient_profile, dosage_info, past_medications)
    parsed_data["safety_alerts"] = safety_data.get("alerts", [])
    parsed_data["polypharmacy_notes"] = safety_data.get("polypharmacy_notes", [])
    parsed_data["environmental"] = safety_data.get("environmental", {})

    return parsed_data


def chat_with_pharmacist(question, context, api_key=None, lang='English'):
    from google import genai

    load_dotenv(override=True)
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        return "API Key missing."

    client = genai.Client(api_key=key)
    prompt = f"Context: {context}\nUser: {question}\nRespond in {lang}."
    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=prompt
    )
    return response.text if response.text else "AI is currently busy."
