import os
import asyncio
from dotenv import load_dotenv
from google import genai

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=key)

try:
    r = client.models.generate_content(model="gemini-2.5-flash", contents=["test"])
    print("SUCCESS:", r.text)
except Exception as e:
    print("ERROR:", str(e))
