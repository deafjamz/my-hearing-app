import os
import csv
import requests
import time
import json
import re

# ==============================================================================
# CONFIGURATION
# ==============================================================================
print("▶️ INITIALIZING LOCAL AUDIO GENERATOR...")

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

# 2. Voice IDs (from GEMINI.md)
FEMALE_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # Sarah
MALE_VOICE_ID = "TxGEqnHWrfWFTfGW9XjX"    # Bill (or David in context)

# 3. Paths
CSV_FILE = "story_data_for_sheets.csv"
AUDIO_REPO_PATH = "hearing-rehab-audio"

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

def generate_audio_file(text, filename, voice_id, output_folder):
    """Generates audio via ElevenLabs API and saves to file."""
    
    # Create folder if needed
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        
    output_path = os.path.join(output_folder, filename)
    
    # Check if exists
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

def process_stories():
    print(f"\n▶️ Processing stories from {CSV_FILE}...")
    
    if not os.path.exists(CSV_FILE):
        print(f"    - ❌ CSV file not found: {CSV_FILE}")
        return

    count = 0
    success_count = 0
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get('Title')
            text = row.get('Text')
            voice_gender = row.get('Voice', 'female').lower()
            filename = row.get('Filename')
            
            if not text or not filename:
                print(f"    - ⚠️  Skipping invalid row: {row}")
                continue
                
            count += 1
            
            # Determine output folder and voice ID
            if voice_gender == 'male':
                voice_id = MALE_VOICE_ID
                output_folder = os.path.join(AUDIO_REPO_PATH, "male_audio")
            else:
                voice_id = FEMALE_VOICE_ID
                output_folder = os.path.join(AUDIO_REPO_PATH, "female_audio")
            
            # Generate
            if generate_audio_file(text, filename, voice_id, output_folder):
                success_count += 1
                
            # Rate limit politeness
            time.sleep(1)

    print(f"\n✅ Processing Complete!")
    print(f"   - Processed: {count} stories")
    print(f"   - Success:   {success_count}")

# ==============================================================================
# MAIN
# ==============================================================================
if __name__ == "__main__":
    process_stories()
