from gtts import gTTS
import os
import uuid

def generate_audio(text, lang='en'):
    """
    Generates an audio file from text in the specified language.
    Returns the path to the generated file.
    """
    try:
        # Create audio directory if not exists
        audio_dir = "audio_summaries"
        if not os.path.exists(audio_dir):
            os.makedirs(audio_dir)
            
        # Clean up old audio files
        for f in os.listdir(audio_dir):
            try:
                os.remove(os.path.join(audio_dir, f))
            except:
                pass

        filename = f"{uuid.uuid4()}.mp3"
        filepath = os.path.join(audio_dir, filename)
        
        # Determine language code for gTTS
        # Robust check for Hindi/English
        lang_input = str(lang).lower()
        lang_code = 'hi' if lang_input in ['hindi', 'hi'] else 'en'
        
        # Clean text to prevent gTTS glitches
        clean_text = text.strip().replace('*', '').replace('#', '')

        tts = gTTS(text=clean_text, lang=lang_code, slow=False)
        tts.save(filepath)
        return filepath
    except Exception as e:
        print(f"Audio Error: {e}")
        return None
