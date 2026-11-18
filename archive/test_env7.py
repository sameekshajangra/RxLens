import os
import asyncio
from dotenv import load_dotenv
from google import genai

load_dotenv(".env.vercel.prod")
key = os.getenv("GEMINI_API_KEY")
print("Key exists in prod env:", bool(key))
client = genai.Client(api_key=key)

try:
    r = client.models.generate_content(model="gemini-3.5-flash", contents=["test"])
    print("SUCCESS 3.5-flash:", r.text)
except Exception as e:
    print("ERROR 3.5-flash:", str(e))
