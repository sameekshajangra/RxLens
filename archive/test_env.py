import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
key = os.getenv("GEMINI_API_KEY")
print("Key exists:", bool(key))
client = genai.Client(api_key=key)
try:
    response = client.models.generate_content(model="gemini-2.5-flash", contents=["Reply with 'hello'"])
    print("2.5-flash Success:", response.text)
except Exception as e:
    print("2.5-flash Error:", type(e), str(e))

try:
    response = client.models.generate_content(model="gemini-2.0-flash", contents=["Reply with 'hello'"])
    print("2.0-flash Success:", response.text)
except Exception as e:
    print("2.0-flash Error:", type(e), str(e))
