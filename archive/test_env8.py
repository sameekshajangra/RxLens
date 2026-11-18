import os
import asyncio
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=key)

try:
    # create a dummy image (1x1 transparent png)
    img_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    contents = [
        types.Part.from_bytes(data=img_bytes, mime_type="image/png"),
        "Describe this image"
    ]
    
    print("Testing gemini-3.5-flash...")
    r = client.models.generate_content(model="gemini-3.5-flash", contents=contents)
    print("SUCCESS:", r.text)
except Exception as e:
    print("ERROR:", str(e))
