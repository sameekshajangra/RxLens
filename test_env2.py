import os
from dotenv import load_dotenv
from google import genai
load_dotenv()
key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=key)

for m in ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-lite-preview-02-05"]:
    try:
        r = client.models.generate_content(model=m, contents=["hello"])
        print(m, "SUCCESS")
    except Exception as e:
        print(m, "ERROR", str(e))
