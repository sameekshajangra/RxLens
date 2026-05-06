# RxLens 🩺 – AI-Powered Clinical Prescription Assistant

RxLens is an enterprise-grade medical AI platform that digitizes handwritten prescriptions, generates **interactive treatment schedules**, provides **bilingual audio guidance** (English & Hindi), and flags clinical safety alerts — all in real time.

Built with **Google Gemini Vision**, **FastAPI**, and **React (Vite)**.

---

## 🌟 Key Features

| Feature | Description |
|---|---|
| 🔍 **VLM OCR Engine** | Gemini 2.0 Flash + OpenCV preprocessing for high-accuracy prescription digitization |
| 🗓️ **Interactive Treatment Schedule** | AI parses dosage frequency and generates a visual Morning/Afternoon/Evening/Night timeline |
| 🛡️ **Clinical Safety Guard** | Cross-references medications against patient allergies & age in real time |
| 🤖 **AI Clinical Assistant** | Context-aware chatbot ("Ask RxLens") for medication Q&A |
| 🌍 **Bilingual Support** | Full English & Hindi UI with professional text-to-speech audio summaries |
| 📊 **Insights Dashboard** | Analytics via Recharts for medication trends |
| 📄 **PDF Export** | Structured tabular prescription reports |
| 🌙 **Dark Mode** | Glassmorphic, responsive UI with smooth animations |

---

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

- **Python 3.9+**
- **Node.js 18+** & **npm**
- **Google Gemini API Key** → [Get one free at Google AI Studio](https://aistudio.google.com/)

---

## 📂 Project Structure

```
RxLens/
├── backend/            # FastAPI REST Server (main.py)
├── frontend/           # React (Vite) User Interface
│   └── src/
│       ├── App.jsx     # Main UI & state management
│       └── index.css   # Glassmorphic design system
├── src/                # Core AI Engines
│   ├── vision.py       # Gemini VLM prompting & extraction
│   ├── audio.py        # Bilingual Text-to-Speech engine
│   └── pdf_generator.py
├── requirements.txt
└── .env                # Your API key goes here (never commit this!)
```

---

## 🚀 Quick Start

### Step 1 — Clone & Configure

```bash
git clone https://github.com/sameekshajangra/RxLens.git
cd RxLens

# Add your Gemini API Key
echo "GEMINI_API_KEY=your_key_here" > .env
```

### Step 2 — Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the FastAPI server FROM the backend directory
cd backend
python -m uvicorn main:app --reload
```

> The backend will start at **http://localhost:8000**

### Step 3 — Frontend Setup

Open a **new terminal tab**, then:

```bash
cd frontend
npm install
npm run dev
```

> The frontend will start at **http://localhost:5173**

### Step 4 — Open the App

Navigate to **[http://localhost:5173](http://localhost:5173)** in your browser. That's it! 🎉

---

## 🔑 Environment Variables

Create a `.env` file in the **root** of the project:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

> ⚠️ Never commit your `.env` file. It's already in `.gitignore`.

---

## 📦 Key Dependencies

**Python (backend)**
```
fastapi
uvicorn
google-generativeai
opencv-python
Pillow
gTTS
python-dotenv
reportlab
```

**Node (frontend)**
```
react + vite
recharts
```

---

## 🛡️ Privacy & Security

- API keys are managed via environment variables and never committed to version control.
- All prescription data is processed locally and never stored on external servers.

---

## ⚖️ Disclaimer

This application is for **educational and demonstrative purposes only**. Always consult a licensed healthcare professional before making any medical decisions.

---

*Made with ❤️ by Sameeksha Jangra*
