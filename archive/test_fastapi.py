import asyncio
from api.index import _call_gemini_cascading
from dotenv import load_dotenv
import os
load_dotenv()

async def run():
    img_bytes = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    key = os.getenv("GEMINI_API_KEY")
    res = await _call_gemini_cascading(img_bytes, key, "en", "standard", "")
    print(res)

asyncio.run(run())
