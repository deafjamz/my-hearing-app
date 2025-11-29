import os
import requests
import json

# 1. Robust Key Extraction (No libraries)
def get_key():
    if not os.path.exists(".env"): return None
    with open(".env", "r") as f:
        for line in f:
            if line.strip().startswith("ELEVENLABS_API_KEY="):
                return line.split("=", 1)[1].strip()
    return None

KEY = get_key()
if not KEY:
    print("❌ Key not found in .env")
    exit(1)

print(f"🔑 Using Key: {KEY[:8]}...")

# 2. Exact Request Structure (Matching cURL)
url = "https://api.elevenlabs.io/v1/sound-generation"
headers = {
    "xi-api-key": KEY,
    "Content-Type": "application/json"
}
data = {
    "text": "hammer hitting metal",
    "duration_seconds": 1.0,
    "prompt_influence": 0.3
}

print("🔊 Sending Request...")
resp = requests.post(url, json=data, headers=headers)

if resp.status_code == 200:
    print("✅ SUCCESS! Received Audio.")
    with open("test_sfx.mp3", "wb") as f:
        f.write(resp.content)
    print("   Saved to test_sfx.mp3")
else:
    print(f"❌ FAILED: {resp.status_code}")
    print(resp.text)
