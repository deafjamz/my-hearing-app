import os
import requests
import json
import base64
import pandas as pd
import time
import random
from dotenv import load_dotenv
from supabase import create_client, Client

# --- CONFIGURATION ---
# Robust Env Loader
def get_key_from_env_file(key_name, file_path=".env"):
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith(f'{key_name}=') :
                return line.split('=', 1)[1].strip()
    return None

ELEVENLABS_API_KEY = get_key_from_env_file("ELEVENLABS_API_KEY")
SUPABASE_URL = get_key_from_env_file("SUPABASE_URL")
SUPABASE_KEY = get_key_from_env_file("SUPABASE_SERVICE_ROLE_KEY")

if not all([ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Voice Pool
FEMALE_VOICES = ['EXAVITQu4vr4xnSDxMaL', 'ThT5KcBeYPX3keUQqHPh'] 
MALE_VOICES = ['TxGEqnHWrfWFTfGW9XjX', 'pNInz6obpgDQGcFmaJgB']

def upload_to_supabase(bucket, data, path, content_type="audio/mpeg"):
    try:
        supabase.storage.from_(bucket).upload(
            path=path,
            file=data,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"
    except Exception as e:
        print(f"   ❌ Upload Error ({path}): {e}")
        return None

def generate_sfx(prompt, duration=22):
    print(f"   🔊 Generating SFX: '{prompt}' ({duration}s)...")
    url = "https://api.elevenlabs.io/v1/sound-generation"
    headers = { "Content-Type": "application/json", "xi-api-key": ELEVENLABS_API_KEY }
    data = {
        "text": prompt,
        "duration_seconds": duration,
        "prompt_influence": 0.3
    }
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            return response.content
        print(f"   ❌ SFX Error: {response.text}")
        return None
    except Exception as e:
        print(f"   ❌ SFX Network Error: {e}")
        return None

def generate_tts(text, voice_id):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = { "Accept": "audio/mpeg", "Content-Type": "application/json", "xi-api-key": ELEVENLABS_API_KEY }
    data = { "text": text, "model_id": "eleven_turbo_v2_5" }
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            return response.content
        print(f"   ❌ TTS Error: {response.text}")
        return None
    except Exception as e:
        print(f"   ❌ TTS Network Error: {e}")
        return None

def process_scenarios():
    print("🔊 Generating Scenario Assets...")
    
    scenarios = supabase.table("scenarios").select("*").execute().data
    
    for scenario in scenarios:
        print(f"\n🎬 Scenario: {scenario['title']}")
        
        # A. Generate Ambience
        # We check if ambience_path is empty or if we want to regenerate
        if not scenario.get('ambience_path'): 
            # Use the 'ambience_prompt' from CSV ideally, but it's not in DB schema yet?
            # We rely on description + keywords for now, or fetch from CSV if needed.
            # Simple prompt construction:
            prompt = f"{scenario.get('description', 'Ambience')} sound loop"
            
            sfx_data = generate_sfx(prompt, duration=15) # 15s is safer limit for complex sounds
            if sfx_data:
                path = f"scenarios/{scenario['id']}/ambience.mp3"
                url = upload_to_supabase("audio", sfx_data, path)
                if url:
                    supabase.table("scenarios").update({"ambience_path": url}).eq("id", scenario['id']).execute()
                    print("   ✅ Ambience Generated & Linked")
        else:
            print("   ⏩ Ambience exists.")

        # B. Generate Dialogue (Skipping if exists to save time, assuming mostly done)
        items = supabase.table("scenario_items").select("*").eq("scenario_id", scenario['id']).order("order").execute().data
        
        speaker_voice_map = {}
        
        for item in items:
            if item.get('audio_path'): continue # Skip existing lines
            
            speaker = item['speaker']
            if speaker not in speaker_voice_map:
                is_female = "Barista" in speaker or "Receptionist" in speaker 
                pool = FEMALE_VOICES if is_female else MALE_VOICES
                speaker_voice_map[speaker] = random.choice(pool)
            
            voice_id = speaker_voice_map[speaker]
            
            print(f"   🗣️ Generating line {item['order']}...")
            audio_data = generate_tts(item['text'], voice_id)
            if audio_data:
                path = f"scenarios/{scenario['id']}/line_{item['order']}.mp3"
                url = upload_to_supabase("audio", audio_data, path)
                if url:
                    supabase.table("scenario_items").update({"audio_path": url}).eq("id", item['id']).execute()

    print("✨ Scenario Generation Complete")

if __name__ == "__main__":
    process_scenarios()
