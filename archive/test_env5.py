import os
import asyncio
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=key)

try:
    with open("frontend/public/vite.svg", "rb") as f:
        img_bytes = f.read()
    
    contents = [
        types.Part.from_bytes(data=img_bytes, mime_type="image/svg+xml"),
        "Describe this image"
    ]
    
    r = client.models.generate_content(model="gemini-2.5-flash", contents=contents)
    print("SUCCESS:", r.text)
except Exception as e:
    print("ERROR:", str(e))
