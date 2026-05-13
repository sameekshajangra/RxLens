import os
import sys
import json
import cv2
import uuid
import numpy as np
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional

# Add parent directory to path to import src modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.vision import analyze_prescription_vision, chat_with_pharmacist
from src.audio import generate_audio
from src.pdf_generator import generate_pdf_report
from src.database import save_prescription, get_all_prescriptions

app = FastAPI()

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory history for demo purposes, initialized from database
prescription_history = get_all_prescriptions()

@app.get("/")
def read_root():
    return {"status": "RxLens Clinical Backend is Running"}

@app.get("/api/config")
def get_config():
    from dotenv import load_dotenv
    load_dotenv(override=True)
    return {
        "api_key_configured": bool(os.getenv("GEMINI_API_KEY"))
    }

@app.get("/api/history")
def get_history():
    return get_all_prescriptions()

@app.post("/api/extract")
async def extract_prescription(
    file: UploadFile = File(...), 
    api_key: str = Form(None), 
    lang: str = Form("English"),
    patient_profile: str = Form(None)
):
    try:
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Parse patient profile
        profile_data = None
        if patient_profile:
            try:
                profile_data = json.loads(patient_profile)
            except:
                pass

        # Process with VLM (Gemini) - now with patient context and schedule engine!
        parsed_data = analyze_prescription_vision(img, api_key=api_key, lang=lang, patient_profile=profile_data)
        
        if not parsed_data:
            raise HTTPException(status_code=500, detail="Failed to parse prescription")

        # Create localized summary
        summary_text = parsed_data.get("summary", "No summary available.")
        
        # Count safety alerts for history
        safety_alerts = parsed_data.get("safety_alerts", [])
        alert_count = len(safety_alerts)
        critical_count = len([a for a in safety_alerts if a.get("severity") == "Critical"])
        
        # Save to history
        record = {
            "drug_name": parsed_data.get("drug", "Unknown"),
            "dosage": parsed_data.get("dosage", "N/A"),
            "frequency": parsed_data.get("frequency", "As directed"),
            "duration": parsed_data.get("duration", "N/A"),
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "summary": summary_text,
            "schedule": parsed_data.get("schedule", []),
            "safety_alert_count": alert_count,
            "critical_alert_count": critical_count,
            "safety_alerts": safety_alerts
        }
        prescription_history.insert(0, record)
        save_prescription(record)

        return {
            "success": True,
            "data": parsed_data,
            "summary": summary_text
        }

    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg or "Quota" in err_msg:
            raise HTTPException(status_code=429, detail="AI is recharging! Daily limit reached. Please wait 30s.")
        raise HTTPException(status_code=500, detail=f"AI Engine Error: {err_msg}")

@app.post("/api/audio")
async def get_audio(text: str = Form(...), lang: str = Form("English")):
    try:
        audio_path = generate_audio(text, lang=lang)
        if not audio_path or not os.path.exists(audio_path):
            raise HTTPException(status_code=500, detail="Audio generation failed")
        return FileResponse(audio_path, media_type="audio/mpeg", filename="guide.mp3")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pdf")
async def get_pdf(
    drug: str = Form(...),
    dosage: str = Form(""),
    frequency: str = Form(""),
    duration: str = Form(""),
    summary: str = Form(""),
    safety_alerts: str = Form("[]")
):
    try:
        # Parse safety alerts from JSON string
        try:
            alerts_data = json.loads(safety_alerts)
        except:
            alerts_data = []
        
        data = {
            "drug": drug,
            "dosage": dosage,
            "frequency": frequency,
            "duration": duration,
            "summary": summary,
            "safety_alerts": alerts_data
        }
        # Use a unique filename for each user to avoid race conditions
        unique_filename = f"report_{uuid.uuid4().hex}.pdf"
        output_path = os.path.join("/tmp", unique_filename) if os.path.exists("/tmp") else unique_filename
        pdf_path = generate_pdf_report(data, output_path)
        return FileResponse(pdf_path, media_type="application/pdf", filename="RxLens_Report.pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(
    question: str = Form(...),
    context: str = Form(""),
    lang: str = Form("English"),
    api_key: str = Form(None)
):
    try:
        answer = chat_with_pharmacist(question, context, api_key=api_key, lang=lang)
        return {"answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
