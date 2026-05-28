import os
from dotenv import load_dotenv
from google import genai
load_dotenv()
key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=key)

test_models = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-3.5-flash",
    "gemini-flash-latest"
]

for m in test_models:
    try:
        r = client.models.generate_content(model=m, contents=["hello"])
        print(m, "SUCCESS")
    except Exception as e:
        print(m, "ERROR", str(e))
