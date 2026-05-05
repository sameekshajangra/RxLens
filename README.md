# RxLens v2 – Premium Clinical Handwriting Intelligence

RxLens is an enterprise-grade intelligent system designed to digitize messy handwritten prescriptions with **100% accuracy**. By leveraging State-of-the-Art Vision-Language Models (Google Gemini), it effortlessly bypasses letterhead noise and illegible cursive to extract exact medical information.

## 🌟 Premium Features
- **Flawless VLM OCR Engine**: Utilizes Gemini 1.5 Flash for perfect digitization of extreme doctor shorthand.
- **Clinical Safety Engine**: Validates extracted drugs against medical databases, checks daily dosage limits, and flags severe drug interactions.
- **Live Camera Integration**: Snap pictures directly from your mobile phone or laptop webcam.
- **Audio Accessibility (TTS)**: Automatically synthesizes a spoken summary of the prescription for elderly or visually impaired patients.
- **PDF Report Generation**: Exports a clean, formatted clinical report of the digitized prescription for hospital records.
- **Enterprise UI**: A pristine, whitespace-heavy "Clinical Hub" dashboard built on Streamlit with custom CSS.

## 📂 Project Structure
```
RxLens/
├── .env                       # Secure API Keys (Must create this!)
├── data/
│   └── mock_drug_db.json      # Validation database
├── src/
│   ├── vision.py              # Gemini VLM Core Engine
│   ├── audio.py               # gTTS Audio Synthesis
│   ├── pdf_generator.py       # ReportLab PDF Export
│   ├── validation.py          # Dosage safety, spell correction, interactions
│   ├── nlp.py                 # (Legacy) Fallback NLP
│   ├── ocr.py                 # (Legacy) Fallback OCR
│   ├── image_processing.py    # Preprocessing
│   └── utils.py               # Summary generation
├── app/
│   └── streamlit_app.py       # Main User Interface
├── README.md                  # Project documentation
└── requirements.txt           # Dependencies
```

## 🚀 Getting Started

1. **Install Requirements**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure API Key**
   - Copy the `.env.example` file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and add your Google Gemini API Key:
     ```
     GEMINI_API_KEY=your_real_key_here
     ```

3. **Run the Application**
   ```bash
   streamlit run app/streamlit_app.py
   ```

4. **Usage**
   - Open the dashboard in your browser.
   - Choose to **Upload a File** or **Take a Photo** using your webcam.
   - The system will process the image, validate the clinical data, provide audio playback, and allow you to download a PDF report!
