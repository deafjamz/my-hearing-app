import os
import requests
import pandas as pd
import json
import time
from dotenv import load_dotenv
from supabase import create_client, Client
import subprocess
import uuid
import re

# --- CONFIGURATION ---
load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # MUST be Service Role for writing

# Check Config
if not all([ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing API Keys in .env (ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)")
    exit(1)

# Init Clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Voice IDs
VOICES = {
    'sarah': 'EXAVITQu4vr4xnSDxMaL', # Female Primary
    'bill': 'TxGEqnHWrfWFTfGW9XjX'   # Male Primary
}

# --- HELPERS ---

def slugify(text):
    """Converts text to a URL-friendly slug for filenames."""
    text = text.lower().replace(' ', '-')
    text = re.sub(r'[^a-z0-9-]', '', text) # Remove non-alphanumeric except hyphen
    text = re.sub(r'-+', '-', text) # Replace multiple hyphens with single
    return text.strip('-')

def clean_text(val):
    if pd.isna(val): return ""
    return str(val).strip().strip('"')

def upload_to_supabase(bucket, file_path, destination_path, content_type=None):
    """Uploads a local file to Supabase Storage."""
    try:
        if content_type is None:
            if file_path.endswith('.mp3'): content_type = "audio/mpeg"
            elif file_path.endswith('.json'): content_type = "application/json"
            else: content_type = "application/octet-stream" # Default

        with open(file_path, 'rb') as f:
            response = supabase.storage.from_(bucket).upload(
                path=destination_path,
                file=f,
                file_options={"content-type": content_type, "upsert": "true"}
            )
        # Construct Public URL
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{destination_path}"
        print(f"   ☁️ Uploaded: {destination_path}")
        return public_url
    except Exception as e:
        print(f"   ❌ Upload Error: {e}")
        return None

def generate_tts_audio(text, voice_id, model_id="eleven_turbo_v2_5"):
    """Generates TTS audio and returns binary content."""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "model_id": model_id,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            return response.content
        else:
            print(f"   ❌ TTS Error ({voice_id}): {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ TTS Network Error ({voice_id}): {e}")
        return None

def trim_silence_ffmpeg(input_path, output_path, silence_threshold_db=-30, min_silence_duration_s=0.1):
    """Trims leading and trailing silence using FFmpeg filter graph (reverse trick)."""
    # Filter Explanation:
    # 1. silenceremove (remove start silence)
    # 2. areverse (reverse audio)
    # 3. silenceremove (remove start silence, which is actually end silence)
    # 4. areverse (restore normal order)
    
    filter_graph = (
        f"silenceremove=start_periods=1:start_threshold={silence_threshold_db}dB:start_duration={min_silence_duration_s}:detection=peak,"
        "areverse,"
        f"silenceremove=start_periods=1:start_threshold={silence_threshold_db}dB:start_duration={min_silence_duration_s}:detection=peak,"
        "areverse"
    )

    command = [
        "ffmpeg",
        "-y", # Overwrite output files without asking
        "-v", "error", # Suppress verbose output
        "-i", input_path,
        "-af", filter_graph,
        output_path
    ]
    
    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"   ❌ FFmpeg Silence Trim Error: {e.stderr}")
        return False


# --- WORKFLOWS ---

def process_words_cloud():
    print("\n🔄 Processing Word Pairs (Cloud)...")
    word_csv_path = os.path.join("content/source_csvs", "Hearing Rehab Project - Words.csv")
    if not os.path.exists(word_csv_path): 
        print(f"   ⚠️ Master Words CSV not found at {word_csv_path}.")
        return

    df = pd.read_csv(word_csv_path)
    df.columns = [c.strip() for c in df.columns]

    w1_col = next((c for c in df.columns if 'Word1' in c or 'Correct' in c), None)
    w2_col = next((c for c in df.columns if 'Word2' in c or 'Option' in c), None)

    if not w1_col or not w2_col:
        print("   ❌ Columns Word1/Word2 (or Correct/Option) not found in Words CSV.")
        return

    words_to_process = set()
    for _, row in df.iterrows():
        words_to_process.add(clean_text(row[w1_col]))
        words_to_process.add(clean_text(row[w2_col]))

    words_to_process = sorted(list(words_to_process))

    for word in words_to_process:
        print(f"\nProcessing word: '{word}'")
        text_to_generate = f"{word}." # Direct word generation with a period for stability

        for voice_name, voice_id in VOICES.items():
            audio_remote_path = f"words/{voice_name}/{slugify(word)}.mp3"
            
            # Check if file exists in Supabase Storage already
            # NOTE: For speed, we just try generation. Upsert handles replacement.
            # If you want to skip existing, you'd need to list bucket contents first.
            
            # 1. Generate TTS audio (binary content)
            raw_audio_content = generate_tts_audio(text_to_generate, voice_id)
            if raw_audio_content is None: continue

            # 2. Save raw audio to a temporary file
            temp_raw_mp3 = f"temp_raw_{uuid.uuid4()}.mp3"
            final_mp3 = f"final_word_{uuid.uuid4()}.mp3"
            with open(temp_raw_mp3, 'wb') as f: f.write(raw_audio_content)

            # 3. Remove silence using FFmpeg
            if trim_silence_ffmpeg(temp_raw_mp3, final_mp3):
                # 4. Upload cleaned audio to Supabase Storage
                upload_to_supabase("audio", final_mp3, audio_remote_path)
            else:
                # Fallback: Upload raw if trim fails
                print(f"   ⚠️ Trim failed, uploading raw audio.")
                upload_to_supabase("audio", temp_raw_mp3, audio_remote_path)

            # Cleanup temp files
            if os.path.exists(temp_raw_mp3): os.remove(temp_raw_mp3)
            if os.path.exists(final_mp3): os.remove(final_mp3)


def process_stories_cloud():
    print("\n🔄 Processing Stories (Cloud)...")
    csv_path = os.path.join("content/source_csvs", "Hearing Rehab Project - Stories.csv")
    if not os.path.exists(csv_path): 
        print(f"   ⚠️ File not found: {csv_path}")
        return

    df = pd.read_csv(csv_path)
    df.columns = [c.strip() for c in df.columns]
    
    for _, row in df.iterrows():
        title = clean_text(row.get('Title'))
        text = clean_text(row.get('Text'))
        if not title or not text: continue
        
        print(f"\n📖 Story: {title}")
        
        # Process Female Voice
        female_audio_remote_path = f"stories/female/{slugify(title)}.mp3"
        
        raw_audio_content_f = generate_tts_audio(text, VOICES['sarah'], model_id="eleven_v3_alpha")
        if raw_audio_content_f:
            temp_raw_mp3_f = f"temp_story_f_{uuid.uuid4()}.mp3"
            with open(temp_raw_mp3_f, 'wb') as f: f.write(raw_audio_content_f)
            upload_to_supabase("audio", temp_raw_mp3_f, female_audio_remote_path)
            if os.path.exists(temp_raw_mp3_f): os.remove(temp_raw_mp3_f)

        # Process Male Voice
        male_audio_remote_path = f"stories/male/{slugify(title)}.mp3"
        
        raw_audio_content_m = generate_tts_audio(text, VOICES['bill'], model_id="eleven_v3_alpha")
        if raw_audio_content_m:
            temp_raw_mp3_m = f"temp_story_m_{uuid.uuid4()}.mp3"
            with open(temp_raw_mp3_m, 'wb') as f: f.write(raw_audio_content_m)
            upload_to_supabase("audio", temp_raw_mp3_m, male_audio_remote_path)
            if os.path.exists(temp_raw_mp3_m): os.remove(temp_raw_mp3_m)

def main():
    print("🚀 Starting Cloud Asset Generation...")
    
    # Check for ffmpeg
    try:
        subprocess.run(["ffmpeg", "-version"], check=True, capture_output=True, text=True)
        print("✅ FFmpeg found.")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ FFmpeg not found. Please install it.")
        return

    process_words_cloud()
    process_stories_cloud()
    print("✨ Cloud Asset Generation Complete.")

if __name__ == "__main__":
    main()
