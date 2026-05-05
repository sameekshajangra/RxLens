import json
import cv2
import numpy as np
from PIL import Image, ImageEnhance
import os
from dotenv import load_dotenv
import io
import requests
import base64
import time

def preprocess_image(image):
    """
    Applies computer vision techniques to sharpen handwriting and improve AI legibility.
    """
    # 1. Convert to Grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 2. Rescaling (DPI increase for OCR)
    scale_percent = 150 # increase size by 50%
    width = int(gray.shape[1] * scale_percent / 100)
    height = int(gray.shape[0] * scale_percent / 100)
    resized = cv2.resize(gray, (width, height), interpolation=cv2.INTER_CUBIC)
    
    # 3. Denoising & Sharpening
    denoised = cv2.fastNlMeansDenoising(resized, h=10)
    
    # 4. Adaptive Thresholding (makes it look like a scanned document)
    thresh = cv2.adaptiveThreshold(denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
    
    return Image.fromarray(thresh)

def analyze_prescription_vision(image, api_key=None):
    """
    Sends the image to the Gemini Vision API using a Multi-Stage Refinement Prompt.
    """
    try:
        load_dotenv(override=True)
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            raise ValueError("No Gemini API Key found.")
        
        if key == "DEMO_MODE":
            return {
                "drug": "Paracetamol, Amoxicillin",
                "dosage": "500mg, 250mg",
                "frequency": "twice a day, thrice a day",
                "duration": "5 days"
            }

        # Preprocess for extreme accuracy
        processed_pil = preprocess_image(image)
        
        # Convert to base64
        img_byte_arr = io.BytesIO()
        processed_pil.save(img_byte_arr, format='JPEG', quality=95)
        img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
        
        # CHAIN-OF-THOUGHT PROMPT
        prompt = '''As an elite clinical pharmacist, perform a multi-stage analysis of this prescription:

        STAGE 1: Transcribe EVERY single handwritten word on the page, regardless of how messy it is.
        STAGE 2: Identify medication names, their dosages, frequencies, and durations.
        STAGE 3: Verify your findings against standard medical databases to correct minor spelling errors (e.g., "Parcetamol" -> "Paracetamol").

        CRITICAL: If there are multiple medications, you MUST list them all. Do not ignore any entry.
        
        Return ONLY a JSON object with this exact structure:
        {
            "drug": "Drug 1, Drug 2, Drug 3",
            "dosage": "Dose 1, Dose 2, Dose 3",
            "frequency": "Freq 1, Freq 2, Freq 3",
            "duration": "Dur 1, Dur 2, Dur 3"
        }
        '''
        
        models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"]
        
        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}, {"inline_data": {"mime_type": "image/jpeg", "data": img_base64}}]}]
            }
            
            response = requests.post(url, json=payload, timeout=60)
            if response.status_code == 200:
                text = response.json()['candidates'][0]['content']['parts'][0]['text'].strip()
                if "```" in text:
                    text = text.split("```")[1]
                    if text.startswith("json"): text = text[4:]
                return json.loads(text.strip())
            elif response.status_code == 429:
                time.sleep(20)
                
        raise Exception("Quota exceeded.")
    except Exception as e:
        print(f"Vision API Error: {e}")
        return None

def chat_with_pharmacist(question, context, api_key=None):
    """
    Handles clinical questions using Gemini with robust retry logic.
    """
    try:
        load_dotenv(override=True)
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key or key == "DEMO_MODE":
            return "In DEMO_MODE: This medication is typically for relief. Consult a doctor for specifics."

        models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash"]
        prompt = f"You are a clinical pharmacist. Context: {context}. Question: {question}. Answer concisely (2-3 sentences) + Disclaimer."

        for model in models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            
            response = requests.post(url, json=payload, timeout=30)
            if response.status_code == 200:
                return response.json()['candidates'][0]['content']['parts'][0]['text']
            elif response.status_code == 429:
                time.sleep(5)
                
        return "Assistant is resetting. Please wait 30 seconds."
    except Exception as e:
        return "Sorry, I'm having trouble thinking right now."
