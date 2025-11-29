import os
import requests
import pandas as pd
import json
import time
from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
AUDIO_OUTPUT_DIR = "public/hearing-rehab-audio"
CSV_SOURCE_DIR = "content/source_csvs"

# Voice IDs (Clinical Standard)
VOICES = {
    'sarah': 'EXAVITQu4vr4xnSDxMaL', # Female
    'bill': 'TxGEqnHWrfWFTfGW9XjX'   # Male
}

# --- API HELPERS ---

def generate_tts(text, voice_id, output_path):
    """Generates audio using ElevenLabs TTS API."""
    if os.path.exists(output_path):
        print(f"   ⏩ Skipping {os.path.basename(output_path)} (Exists)")
        return True

    print(f"   🎙️ Generating: {text[:20]}...")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "model_id": "eleven_turbo_v2_5", # Low latency, high quality
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }

    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            return True
        else:
            print(f"   ❌ Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Network Error: {e}")
        return False

def generate_alignment(audio_path, transcript, output_path):
    """Generates timestamp JSON using ElevenLabs Forced Alignment API."""
    if os.path.exists(output_path):
        return True

    print(f"   ⏱️ Aligning: {os.path.basename(audio_path)}...")
    url = "https://api.elevenlabs.io/v1/forced-alignment"
    headers = {"xi-api-key": ELEVENLABS_API_KEY}
    
    try:
        with open(audio_path, 'rb') as f:
            files = {'audio_file': f}
            data = {'text': transcript}
            response = requests.post(url, headers=headers, files=files, data=data)
            
        if response.status_code == 200:
            alignment_data = response.json()
            with open(output_path, 'w') as f:
                json.dump(alignment_data, f, indent=2)
            return True
        else:
            print(f"   ❌ Alignment Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Alignment Network Error: {e}")
        return False

def generate_sound_effect(prompt, output_path, duration=30):
    """Generates a sound effect using ElevenLabs Sound Effects API."""
    if os.path.exists(output_path):
        return True

    print(f"   🔊 Generating SFX: {prompt[:20]}...")
    url = "https://api.elevenlabs.io/v1/sound-generation"
    headers = {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": prompt,
        "duration_seconds": duration,
        "prompt_influence": 0.3 # Allow some creativity
    }

    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            return True
        else:
            print(f"   ❌ SFX Error: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ SFX Network Error: {e}")
        return False

# --- WORKFLOWS ---

def process_stories():
    """Reads Stories CSV, generates Audio + Alignment."""
    csv_path = os.path.join(CSV_SOURCE_DIR, "stories_master.csv") # Assuming synced
    if not os.path.exists(csv_path): return

    df = pd.read_csv(csv_path)
    
    # Ensure directories
    for voice in ['female', 'male']:
        os.makedirs(os.path.join(AUDIO_OUTPUT_DIR, f"{voice}_audio"), exist_ok=True)

    for _, row in df.iterrows():
        title = row.get('Title', 'Unknown')
        text = row.get('Text', '')
        # Simple ID generation or use ID column
        story_id = row.get('id', title.lower().replace(' ', '_'))
        
        # 1. Generate Female Version
        f_path = os.path.join(AUDIO_OUTPUT_DIR, "female_audio", f"{story_id}.mp3")
        f_align_path = os.path.join(AUDIO_OUTPUT_DIR, "female_audio", f"{story_id}.json")
        
        if generate_tts(text, VOICES['sarah'], f_path):
            generate_alignment(f_path, text, f_align_path)

        # 2. Generate Male Version
        m_path = os.path.join(AUDIO_OUTPUT_DIR, "male_audio", f"{story_id}.mp3")
        m_align_path = os.path.join(AUDIO_OUTPUT_DIR, "male_audio", f"{story_id}.json")
        
        if generate_tts(text, VOICES['bill'], m_path):
            generate_alignment(m_path, text, m_align_path)

def process_scenarios():
    """Reads Scenarios CSV, generates Ambience."""
    # Placeholder for scenario logic
    pass

if __name__ == "__main__":
    if not ELEVENLABS_API_KEY:
        print("❌ Error: ELEVENLABS_API_KEY not found in .env")
        exit(1)
        
    print("🚀 Starting Gen 2 Asset Generation...")
    process_stories()
    # process_scenarios()
    print("✨ Done.")
