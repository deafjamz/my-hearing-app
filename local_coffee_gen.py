import os
import csv
import requests
import time

# ==============================================================================
# CONFIGURATION
# ==============================================================================
print("▶️ INITIALIZING LOCAL COFFEE SHOP AUDIO GENERATOR...")

# 1. Load Secrets from .env
ENV_FILE = ".env"
ELEVENLABS_API_KEY = None

if os.path.exists(ENV_FILE):
    print(f"    - Loading secrets from {ENV_FILE}")
    with open(ENV_FILE, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith("ELEVENLABS_API_KEY="):
                ELEVENLABS_API_KEY = line.split("=", 1)[1].strip('"')
                print("    - ✅ Found ELEVENLABS_API_KEY")
                break
else:
    print(f"    - ❌ {ENV_FILE} not found!")

if not ELEVENLABS_API_KEY:
    print("    - ❌ Error: ELEVENLABS_API_KEY not found in .env")
    exit(1)

# 2. Voice IDs
VOICE_CONFIG = {
    "david": "pNInz6obpgDQGcFmaJgB",
    "marcus": "TxGEqnHWrfWFTfGW9XjX",
    "sarah": "EXAVITQu4vr4xnSDxMaL",
    "emma": "ErXwobaYiN019PkySvjV"
}

# 3. Paths
CSV_FILE = "coffee_shop_scenarios.csv"
AUDIO_REPO_PATH = "hearing-rehab-audio"

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

def generate_audio_file(text, filename, voice_id, output_folder):
    """Generates audio via ElevenLabs API and saves to file."""
    
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        
    output_path = os.path.join(output_folder, filename)
    
    if os.path.exists(output_path):
        print(f"    - ⏭️  Skipping existing: {filename}")
        return True

    print(f"    - 🎙️  Generating: {filename} ...")
    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"    - ✅ Saved: {output_path}")
            return True
        else:
            print(f"    - ❌ API Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"    - ❌ Network Error: {e}")
        return False

def process_scenarios():
    print(f"\n▶️ Processing scenarios from {CSV_FILE}...")
    
    if not os.path.exists(CSV_FILE):
        print(f"    - ❌ CSV file not found: {CSV_FILE}")
        return

    scenarios = []
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        scenarios = list(reader)

    print(f"    - Found {len(scenarios)} scenarios.")
    
    total_generated = 0
    
    # Generate audio for ALL 4 voices for EACH scenario
    for voice_name, voice_id in VOICE_CONFIG.items():
        print(f"\n🎤 Processing Voice: {voice_name.upper()}")
        output_folder = os.path.join(AUDIO_REPO_PATH, f"{voice_name}_audio")
        
        for row in scenarios:
            text = row.get('Text')
            filename = row.get('Filename')
            
            if text and filename:
                if generate_audio_file(text, filename, voice_id, output_folder):
                    total_generated += 1
                time.sleep(1) # Rate limit politeness

    print(f"\n✅ Generation Complete! Total files handled: {total_generated}")

# ==============================================================================
# MAIN
# ==============================================================================
if __name__ == "__main__":
    process_scenarios()
