import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
headers = {'Content-Type': 'application/json'}
data = {
    "contents": [{"parts":[{"text": "Say 'REST API works'"}]}]
}

print(f"Testing REST API with Key: {api_key[:5]}...")
try:
    response = requests.post(url, headers=headers, data=json.dumps(data))
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"REST Error: {e}")
