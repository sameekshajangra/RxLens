import os
from dotenv import load_dotenv
from google import genai
load_dotenv()
key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=key)

for m in client.models.list():
    print(m.name)
