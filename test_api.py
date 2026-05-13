import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"Testing API Key: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

if not api_key:
    print("ERROR: No API Key found in .env!")
    exit(1)

try:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-2.0-flash-lite",
        contents="Say 'Flash Lite Works!'"
    )
    print(f"Response: {response.text}")
except Exception as e:
    print(f"API Error: {str(e)}")
