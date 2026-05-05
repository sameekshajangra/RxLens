from gtts import gTTS
import os
import base64

def generate_audio(text, lang='en'):
    """
    Generates speech from text and saves it as an MP3 file.
    Returns the file path.
    """
    if not text:
        return None
        
    try:
        tts = gTTS(text=text, lang=lang, slow=False)
        output_path = "/tmp/prescription_audio.mp3"
        tts.save(output_path)
        return output_path
    except Exception as e:
        print(f"Audio Generation Error: {e}")
        return None

def get_audio_html(file_path):
    """
    Converts audio file to base64 encoded HTML audio player.
    """
    if not file_path or not os.path.exists(file_path):
        return ""
        
    with open(file_path, "rb") as f:
        data = f.read()
        b64 = base64.b64encode(data).decode()
        
    audio_html = f"""
        <audio controls autoplay>
        <source src="data:audio/mp3;base64,{b64}" type="audio/mp3">
        Your browser does not support the audio element.
        </audio>
    """
    return audio_html
