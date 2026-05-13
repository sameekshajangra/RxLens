import os
import io
import json
import cv2
import numpy as np
from PIL import Image
from dotenv import load_dotenv
from src.safety_engine import analyze_safety


def preprocess_image(image):
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        return Image.fromarray(gray)
    except Exception:
        return Image.fromarray(image)


def compute_overall_confidence(confidence_data):
    """Compute an overall confidence score from per-field confidence data."""
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
    """Generate user-facing uncertainty warnings based on confidence scores."""
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
                "field": field,
                "score": score,
                "level": "low",
                "message": f"Low confidence ({int(score*100)}%) detected for {label}. Please verify with your pharmacist.",
                "action": "Verify with pharmacist before use"
            })
        elif score < thresholds["medium"]:
            warnings.append({
                "field": field,
                "score": score,
                "level": "medium",
                "message": f"Moderate confidence ({int(score*100)}%) for {label}. Double-check this value.",
                "action": "Double-check recommended"
            })

    return warnings


def _extract_json_from_text(text):
    """Robustly extract JSON from AI response that may be wrapped in markdown fences."""
    text = text.strip()
    # Handle ```json ... ``` or ``` ... ```
    if "```" in text:
        parts = text.split("```")
        # Odd-indexed parts are inside fences
        for part in parts[1::2]:
            cleaned = part.strip()
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()
            if cleaned.startswith("{"):
                return cleaned
    # No fences — find the JSON object directly
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text


def analyze_prescription_vision(image, api_key=None, lang='English', patient_profile=None):
    """
    Advanced Vision Analysis with Confidence Scoring & Clinical Safety Intelligence.
    Uses the google-genai SDK (google.genai).
    """
    from google import genai
    from google.genai import types

    load_dotenv(override=True)
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("API Key missing.")

    client = genai.Client(api_key=key)

    processed_pil = preprocess_image(image)

    # Convert PIL image to bytes for the new SDK
    img_byte_arr = io.BytesIO()
    processed_pil.save(img_byte_arr, format='PNG')
    img_bytes = img_byte_arr.getvalue()

    profile_context = f"Patient Profile: {json.dumps(patient_profile)}" if patient_profile else ""

    prompt = f"""
    Digitize this prescription into JSON in {lang}.
    {profile_context}

    CRITICAL INSTRUCTIONS:
    1. EXTRACT DRUGS: List ALL medications — include brand names AND generic names.
    2. DOSAGE RED FLAGS: Flag unusually high or low dosages.
    3. SCHEDULE: Create a 'schedule' array with Morning, Afternoon, Evening, Night slots.
    4. For each drug, provide dosage in drugs_dosage map.

    CONFIDENCE SCORING (VERY IMPORTANT):
    For each field you extract, rate your confidence from 0.0 to 1.0:
    - 1.0 = clearly readable, no doubt
    - 0.7-0.9 = mostly readable, minor uncertainty
    - 0.4-0.7 = partially readable, significant uncertainty
    - 0.0-0.4 = barely readable, guessing

    Also provide "uncertain_fields" — list any field names where you had to guess or are unsure.

    Common Indian brands: Dolo=Paracetamol, Crocin=Paracetamol, Calpol=Paracetamol,
    Combiflam=Ibuprofen+Paracetamol, Brufen=Ibuprofen, Voveran=Diclofenac, Augmentin=Amoxicillin,
    Azee=Azithromycin, Pan-D=Pantoprazole, Ciplox=Ciprofloxacin, Meftal=Mefenamic Acid.

    Exact JSON Structure:
    {{
        "drug": "Main medications (comma-separated)",
        "drugs_list": ["Drug A", "Drug B"],
        "drugs_dosage": {{"Drug A": "500mg", "Drug B": "250mg"}},
        "dosage": "Dose info",
        "frequency": "Frequency",
        "duration": "Duration",
        "summary": "Clinical summary in {lang}",
        "ai_safety_observations": "AI-driven safety notes",
        "confidence": {{
            "drug": 0.95,
            "dosage": 0.8,
            "frequency": 0.9,
            "duration": 0.7
        }},
        "uncertain_fields": ["field_name_if_uncertain"],
        "schedule": [
            {{ "drug": "Name", "times": ["Morning", ...], "duration": "5 days" }}
        ]
    }}
    """

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            types.Part.from_bytes(data=img_bytes, mime_type="image/png"),
            prompt
        ]
    )

    response_text = response.text
    if not response_text:
        raise Exception("Empty response from AI engine.")

    json_str = _extract_json_from_text(response_text)
    parsed_data = json.loads(json_str)

    # --- CONFIDENCE & UNCERTAINTY PROCESSING ---
    confidence = parsed_data.get("confidence", {})
    if confidence:
        parsed_data["overall_confidence"] = compute_overall_confidence(confidence)
    else:
        parsed_data["overall_confidence"] = None
        parsed_data["confidence"] = {}

    # Generate human-readable uncertainty warnings
    parsed_data["uncertainty_warnings"] = generate_uncertainty_warnings(parsed_data, lang)

    # Ensure uncertain_fields exists
    if "uncertain_fields" not in parsed_data:
        parsed_data["uncertain_fields"] = []

    # --- RULE-BASED SAFETY INTELLIGENCE ---
    extracted_drugs = parsed_data.get("drugs_list", [])
    if not extracted_drugs and parsed_data.get("drug"):
        extracted_drugs = [d.strip() for d in parsed_data["drug"].split(",") if d.strip()]

    dosage_info = parsed_data.get("drugs_dosage", {})

    safety_alerts = analyze_safety(extracted_drugs, patient_profile, dosage_info)
    parsed_data["safety_alerts"] = safety_alerts

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
        model="gemini-2.0-flash",
        contents=prompt
    )
    return response.text if response.text else "AI is currently busy."
