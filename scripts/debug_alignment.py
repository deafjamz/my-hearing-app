import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

def test_alignment_permissions():
    print("🕵️ Testing Forced Alignment Permissions...")
    
    # 1. Generate Audio
    url_tts = "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL"
    headers = { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" }
    data = { "text": "The word is bear.", "model_id": "eleven_turbo_v2_5" }
    
    print("   1. Generating Audio...")
    resp = requests.post(url_tts, json=data, headers=headers)
    if resp.status_code != 200:
        print(f"   ❌ TTS Failed: {resp.text}")
        return

    with open("temp_align_test.mp3", "wb") as f: f.write(resp.content)

    # 2. Test Alignment
    print("   2. Calling Alignment API...")
    url_align = "https://api.elevenlabs.io/v1/forced-alignment"
    files = {'audio_file': open("temp_align_test.mp3", "rb")} # Trying audio_file again based on docs? No, let's try 'file' which is what the error said last time.
    # Actually, let's try 'file' since that was the specific error "loc: [body, file]".
    files = {'file': open("temp_align_test.mp3", "rb")}
    
    data_align = {'text': "The word is bear."}
    
    resp_align = requests.post(url_align, headers={"xi-api-key": ELEVENLABS_API_KEY}, files=files, data=data_align)
    
    if resp_align.status_code == 200:
        print("   ✅ SUCCESS! Alignment JSON received.")
        print(json.dumps(resp_align.json(), indent=2))
    else:
        print(f"   ❌ FAILED: {resp_align.status_code}")
        print(resp_align.text)

    if os.path.exists("temp_align_test.mp3"): os.remove("temp_align_test.mp3")

if __name__ == "__main__":
    test_alignment_permissions()
