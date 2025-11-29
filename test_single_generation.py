import os
import requests
import json
import uuid
import re
from dotenv import load_dotenv

# Load env
load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

if not ELEVENLABS_API_KEY:
    print("❌ Error: ELEVENLABS_API_KEY not set.")
    exit(1)

def test_alignment_logic():
    print("🧪 TESTING SINGLE WORD GENERATION & ALIGNMENT")
    print("="*60)

    target_word = "bear"
    # Simplified carrier phrase to reduce variables
    carrier_phrase = f"The next word is {target_word}."
    
    print(f"📝 Phrase: '{carrier_phrase}'")
    print(f"🎯 Target: '{target_word}'")

    # 1. Generate TTS
    print("\n1️⃣ Generating TTS (Turbo v2.5)...")
    url_tts = "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL" # Sarah
    headers_tts = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data_tts = {
        "text": carrier_phrase,
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }
    
    response_tts = requests.post(url_tts, json=data_tts, headers=headers_tts)
    if response_tts.status_code != 200:
        print(f"❌ TTS Failed: {response_tts.text}")
        return

    audio_content = response_tts.content
    print(f"✅ TTS Generated ({len(audio_content)} bytes)")

    # 2. Align
    print("\n2️⃣ Performing Alignment...")
    url_align = "https://api.elevenlabs.io/v1/forced-alignment"
    headers_align = {"xi-api-key": ELEVENLABS_API_KEY}
    
    files = {'file': ('test.mp3', audio_content, 'audio/mpeg')}
    data_align = {'text': carrier_phrase}
    
    response_align = requests.post(url_align, headers=headers_align, files=files, data=data_align)
    
    if response_align.status_code != 200:
        print(f"❌ Alignment Failed: {response_align.text}")
        return

    alignment_data = response_align.json()
    print("✅ Alignment Data Received:")
    print(json.dumps(alignment_data, indent=2))

    # 3. Simulate Matching Logic
    print("\n3️⃣ Testing Matching Logic...")
    found = False
    
    # Logic from generate_assets_cloud.py
    for w_data in alignment_data.get('words', []):
        aligned_word = w_data.get('word', '')
        # Simulate the cleaning logic
        cleaned_aligned = aligned_word.lower().strip('.,!?')
        cleaned_target = target_word.lower().strip('.,!?')
        
        print(f"   - Checking: '{aligned_word}' -> '{cleaned_aligned}' vs '{cleaned_target}'")
        
        if cleaned_aligned == cleaned_target:
            print(f"   🎉 MATCH FOUND! Start: {w_data['start']}, End: {w_data['end']}")
            found = True
            break
            
    if not found:
        print("   ❌ NO MATCH FOUND in loop.")

if __name__ == "__main__":
    test_alignment_logic()
