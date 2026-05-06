import os
import io
import json
import base64
import cv2
import numpy as np
from PIL import Image
from dotenv import load_dotenv
import google.generativeai as genai

def preprocess_image(image):
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        return Image.fromarray(gray)
    except:
        return Image.fromarray(image)

def analyze_prescription_vision(image, api_key=None, lang='English', patient_profile=None):
    """
    Advanced Vision Analysis with Clinical Safety Guard.
    """
    load_dotenv(override=True)
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key: raise ValueError("API Key missing.")

    genai.configure(api_key=key)
    model = genai.GenerativeModel('gemini-flash-latest')

    processed_pil = preprocess_image(image)
    
    profile_context = f"Patient Profile: {json.dumps(patient_profile)}" if patient_profile else ""
    
    prompt = f"""
    Digitize this prescription into JSON in {lang}. 
    {profile_context}
    
    CRITICAL INSTRUCTIONS:
    1. SAFETY: Check for allergy/age conflicts against the profile.
    2. SCHEDULE: You MUST create a 'schedule' array. For every drug found, determine if it should be taken in the [Morning, Afternoon, Evening, Night]. 
       - If the prescription says '1-0-1', that's Morning and Night.
       - If it says 'TDS' or '3 times', that's Morning, Afternoon, Night.
       - If unclear, default to 'Morning' and 'Night'.
    
    Exact JSON Structure:
    {{
        "drug": "Med names",
        "dosage": "Dose info",
        "frequency": "Frequency",
        "duration": "Duration",
        "summary": "Full summary in {lang}",
        "safety_alerts": "Safety warnings",
        "schedule": [
            {{ "drug": "Name of drug", "times": ["Morning", "Afternoon", "Evening", "Night"], "duration": "e.g. 5 days" }}
        ]
    }}
    """

    # We do NOT use try-except here so the raw SDK error bubbles up to the backend
    response = model.generate_content([prompt, processed_pil])
    
    if response.text:
        text = response.text.strip()
        if "```" in text:
            text = text.split("```")[1]
            if text.startswith("json"): text = text[4:]
        return json.loads(text.strip())
    else:
        raise Exception("Empty response from AI engine.")

def chat_with_pharmacist(question, context, api_key=None, lang='English'):
    load_dotenv(override=True)
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key: return "API Key missing."

    genai.configure(api_key=key)
    model = genai.GenerativeModel('gemini-flash-latest')
    
    prompt = f"Context: {context}\nUser: {question}\nRespond in {lang}."
    response = model.generate_content(prompt)
    return response.text if response.text else "AI is currently busy."
