# RxLens – Clinical Handwriting Intelligence Hub

RxLens is an enterprise-grade medical AI system designed to digitize messy handwritten prescriptions with high precision. By leveraging **Vision-Language Models (Google Gemini)** and **OpenCV image preprocessing**, it bypasses letterhead noise and illegible cursive to extract structured medical data.

## 🌟 Key Features
- **High-Accuracy VLM OCR Engine**: Uses Gemini 2.0 Flash with multi-stage refinement and image sharpening for perfect digitization.
*   **AI Clinical Assistant**: A context-aware chatbot ("Ask RxLens") that answers questions about medications, side effects, and timing.
- **Clinical Safety Engine**: Integrates with the **NIH RxNav API** to check for severe drug-drug interactions and validate dosage limits.
- **Insights Dashboard**: Real-time analytics using **Recharts** to track medication frequency and scanning trends over time.
- **Accessibility Suite**: Generates professional **Audio Summaries** (TTS) and structured **Tabular PDF Reports**.
- **Modern UI**: A sleek, glassmorphic dashboard with a fluid **Dark Mode** toggle and responsive design.

## 📋 Prerequisites
Before you begin, ensure you have the following installed:
*   **Python 3.9+**
*   **Node.js 18+** & **npm**
*   **Google Gemini API Key** (Obtain from [Google AI Studio](https://aistudio.google.com/))

## 📂 Project Structure
```
RxLens/
├── backend/            # FastAPI REST Server
├── frontend/           # React (Vite) User Interface
├── src/                # Core AI Engines
├── data/               # Static Medical Databases
└── archive/            # Legacy Experiments & Old Code
```

## 🚀 Quick Start

### 1. Backend Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Configure your .env
echo "GEMINI_API_KEY=your_key_here" > .env

# Run the server
uvicorn backend.main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Access the Dashboard
Once both are running, open your browser and navigate to:
**http://localhost:5173**

## 🛡️ Security & Privacy
RxLens is designed with privacy in mind. API keys are managed via environment variables and are never committed to version control. The application uses a local SQLite database for history persistence.

## ⚖️ Disclaimer
This application is for educational and demonstrative purposes only. Always consult a licensed healthcare professional before making any medical decisions.
