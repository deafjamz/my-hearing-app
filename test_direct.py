import os
import requests
import subprocess
from dotenv import load_dotenv

load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

def analyze_audio(filename):
    """Uses ffmpeg to detect silence start/end."""
    try:
        # Detect silence start
        cmd = [
            "ffmpeg", "-i", filename, "-af", "silencedetect=noise=-30dB:d=0.1", "-f", "null", "-"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        print(f"   📊 Analysis for {filename}:")
        # Grep for silencedetect output
        for line in result.stderr.split('\n'):
            if "silence_end" in line or "silence_start" in line:
                print(f"      {line.strip()}")
    except Exception as e:
        print(f"   ❌ Analysis failed: {e}")

def test_direct_generation():
    print("🧪 TESTING DIRECT SINGLE WORD GENERATION")
    print("="*60)
    
    word = "bear"
    output_file = "test_bear_direct.mp3"
    
    url = "https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    # Trying with just the word, maybe adding a period helps stability
    data = {
        "text": "Bear.", 
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }
    
    print(f"1️⃣ Generating '{word}' directly...")
    response = requests.post(url, json=data, headers=headers)
    
    if response.status_code == 200:
        with open(output_file, 'wb') as f:
            f.write(response.content)
        print(f"✅ Saved to {output_file} ({len(response.content)} bytes)")
        analyze_audio(output_file)
    else:
        print(f"❌ Failed: {response.text}")

if __name__ == "__main__":
    test_direct_generation()
