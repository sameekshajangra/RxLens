import requests
import time

URL = "https://rxlens-app.vercel.app/api/extract"

def test_api():
    print("Testing live Vercel API...")
    from PIL import Image
    import io
    img = Image.new('RGB', (800, 800), color='white')
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()
    
    files = {'file': ('test.jpg', img_bytes, 'image/jpeg')}
    data = {'lang': 'English', 'explanation_level': 'standard'}
    
    start = time.time()
    try:
        res = requests.post(URL, files=files, data=data, timeout=70)
        end = time.time()
        print(f"Time taken: {end - start:.2f} seconds")
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.text[:200]}")
    except Exception as e:
        print(f"Request failed: {e}")

test_api()
