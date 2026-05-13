import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

print("Listing models...")
try:
    for m in client.models.list():
        print(f"Model: {m.name}, Supported: {m.supported_variants if hasattr(m, 'supported_variants') else 'N/A'}")
except Exception as e:
    print(f"Error: {e}")
