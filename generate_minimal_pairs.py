import os
import csv
import time
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
if not ELEVENLABS_API_KEY:
    print("❌ Error: ELEVENLABS_API_KEY not found in .env")
    exit(1)

# Configuration
VOICE_CONFIG = {
    "david": "pNInz6obpgDQGcFmaJgB",
    "marcus": "TxGEqnHWrfWFTfGW9XjX",
    "sarah": "EXAVITQu4vr4xnSDxMaL",
    "emma": "ErXwobaYiN019PkySvjV"
}

# Model: Turbo v2.5 is best for speed/short phrases. 
# If you want maximum quality/stability, use multilingual_v2.
MODEL_ID = "eleven_turbo_v2_5" 

AUDIO_OUTPUT_DIR = "public/hearing-rehab-audio"

# The exact list from src/data/minimalPairs.ts
MINIMAL_PAIRS = [
    "Pear", "Bear",
    "Pie", "Buy",
    "Pat", "Bat",
    "Time", "Dime",
    "Toe", "Doe",
    "Coat", "Goat",
    "Class", "Glass",
    "Fan", "Van",
    "Safe", "Save",
    "Sip", "Zip"
]

def generate_audio(text, voice_id, output_path):
    if os.path.exists(output_path):
        print(f"⏭️  Skipping {output_path} (Exists)")
        return True

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    
    data = {
        "text": text,
        "model_id": MODEL_ID,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    try:
        print(f"🎙️  Generating: '{text}'...")
        response = requests.post(url, json=data, headers=headers)
        
        if response.status_code == 200:
            # Ensure directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"✅ Saved: {output_path}")
            return True
        else:
            print(f"❌ API Error ({response.status_code}): {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Network Error: {e}")
        return False

def main():
    print("🎧 STARTING MINIMAL PAIR GENERATION")
    print(f"   - Model: {MODEL_ID}")
    print(f"   - Voices: {list(VOICE_CONFIG.keys())}")
    print(f"   - Words: {len(MINIMAL_PAIRS)}")
    print("=" * 50)

    success_count = 0
    
    # Loop through all voices
    for voice_name, voice_id in VOICE_CONFIG.items():
        print(f"\n🗣️  Voice: {voice_name.upper()}")
        
        # We store them in the main voice folder, e.g. public/hearing-rehab-audio/sarah_audio/pear.mp3
        # This keeps it consistent with how getAudioPath works (it expects /voice_audio/filename)
        
        for word in MINIMAL_PAIRS:
            filename = f"{word.lower()}.mp3"
            output_path = os.path.join(AUDIO_OUTPUT_DIR, f"{voice_name}_audio", filename)
            
            if generate_audio(word, voice_id, output_path):
                success_count += 1
                
            # Be polite to the API
            time.sleep(0.5)

    print("\n" + "=" * 50)
    print(f"🏁 Generation Complete. {success_count} files processed.")

if __name__ == "__main__":
    main()
