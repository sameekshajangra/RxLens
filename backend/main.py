from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import cv2
import numpy as np
import os
import sys

# Add src to path so we can import our existing logic
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.vision import analyze_prescription_vision
from src.validation import validate_drug_name, check_dosage_safety, suggest_corrections, check_drug_interactions
from src.audio import generate_audio
from src.pdf_generator import generate_pdf_report
from src.utils import generate_human_readable_summary
from src.database import save_prescription, get_all_prescriptions

app = FastAPI(title="RxLens API")

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "RxLens Backend is Running"}

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
async def extract_prescription(file: UploadFile = File(...), api_key: str = Form(None)):
    try:
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")

        # Process with VLM (Gemini)
        parsed_data = analyze_prescription_vision(img, api_key=api_key)
        
        if not parsed_data:
            # Fallback could be implemented here (e.g., TrOCR)
            raise HTTPException(status_code=500, detail="Failed to parse prescription")

        # Perform Validation
        validation_results = []
        interactions = []
        
        drug_name = parsed_data.get("drug", "")
        dosage_extracted = parsed_data.get("dosage", "")
        
        if drug_name and drug_name.lower() != "unknown":
            drugs_list = [d.strip() for d in drug_name.split(',')]
            
            for single_drug in drugs_list:
                if not single_drug:
                    continue
                is_valid, msg = validate_drug_name(single_drug)
                drug_info = {
                    "drug": single_drug,
                    "is_valid": is_valid,
                    "message": msg,
                    "suggestions": [],
                    "dosage_safe": None,
                    "dosage_message": ""
                }
                
                if is_valid:
                    if dosage_extracted:
                        safe, dose_msg = check_dosage_safety(single_drug, dosage_extracted)
                        drug_info["dosage_safe"] = safe
                        drug_info["dosage_message"] = dose_msg
                else:
                    drug_info["suggestions"] = suggest_corrections(single_drug)
                
                validation_results.append(drug_info)
            
            if len(drugs_list) > 1:
                interactions = check_drug_interactions(drugs_list)

        # Generate summary and SAVE to database
        summary = generate_human_readable_summary(parsed_data)
        
        save_data = {**parsed_data, "summary": summary}
        save_prescription(save_data)

        return {
            "success": True,
            "data": parsed_data,
            "validation": validation_results,
            "interactions": interactions,
            "summary": summary
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/audio")
async def get_audio(text: str = Form(...)):
    audio_path = generate_audio(text)
    if not audio_path or not os.path.exists(audio_path):
        raise HTTPException(status_code=500, detail="Audio generation failed")
    return FileResponse(audio_path, media_type="audio/mpeg", filename="prescription_audio.mp3")

@app.post("/api/pdf")
async def get_pdf(drug: str = Form(""), dosage: str = Form(""), frequency: str = Form(""), duration: str = Form(""), summary: str = Form("")):
    parsed_data = {
        "drug": drug,
        "dosage": dosage,
        "frequency": frequency,
        "duration": duration,
        "summary": summary
    }
    pdf_path = generate_pdf_report(parsed_data)
    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail="PDF generation failed")
    return FileResponse(pdf_path, media_type="application/pdf", filename="Clinical_Report.pdf")

@app.post("/api/chat")
async def chat_endpoint(question: str = Form(...), context: str = Form(...), api_key: str = Form(None)):
    from src.vision import chat_with_pharmacist
    answer = chat_with_pharmacist(question, context, api_key=api_key)
    return {"answer": answer}
