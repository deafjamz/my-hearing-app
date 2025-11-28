import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
MODEL_ID = "eleven_turbo_v2_5"

VOICES = {
    "sarah": "EXAVITQu4vr4xnSDxMaL",
    "david": "pNInz6obpgDQGcFmaJgB"
}

WORDS = ["Pop", "Ssh"]

METHODS = {
    "raw": lambda w: w,
    "padded": lambda w: f"... {w} ...",
    "carrier": lambda w: f"The word is {w}."
}

OUTPUT_DIR = "public/audio_quality_test"

def generate_test_audio():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    print("🎧 STARTING QUALITY TEST BATCH")
    print("=" * 50)

    for voice_name, voice_id in VOICES.items():
        for word in WORDS:
            for method_name, method_fn in METHODS.items():
                text = method_fn(word)
                filename = f"{voice_name}_{word}_{method_name}.mp3"
                path = os.path.join(OUTPUT_DIR, filename)
                
                print(f"🎙️  Generating: '{text}' -> {filename}")
                
                try:
                    response = requests.post(
                        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                        json={
                            "text": text,
                            "model_id": MODEL_ID,
                            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
                        },
                        headers={
                            "xi-api-key": ELEVENLABS_API_KEY,
                            "Content-Type": "application/json"
                        }
                    )
                    
                    if response.status_code == 200:
                        with open(path, 'wb') as f:
                            f.write(response.content)
                        print("   ✅ Success")
                    else:
                        print(f"   ❌ Error: {response.text}")
                        
                except Exception as e:
                    print(f"   ❌ Exception: {e}")
                
                time.sleep(0.5)

    print("\n🏁 Test Batch Complete. Check 'public/audio_quality_test' folder.")

if __name__ == "__main__":
    generate_test_audio()
