import os
import requests
import json
import base64
import pandas as pd
import re
import time
import subprocess
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client

# --- CONFIGURATION ---
load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

VOICES = {
    'sarah': 'EXAVITQu4vr4xnSDxMaL',
    'marcus': 'TxGEqnHWrfWFTfGW9XjX',
    'emma': 'ThT5KcBeYPX3keUQqHPh',
    'david': 'pNInz6obpgDQGcFmaJgB'
}

WORDS_CSV = "content/source_csvs/Hearing Rehab Project - Words.csv"
BATCH_SIZE = 5

if not all([ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- HELPERS ---

def slugify(text):
    text = str(text).lower().strip()
    text = re.sub(r'[^a-z0-9-]', '', text.replace(' ', '-'))
    return re.sub(r'-+', '-', text)

def clean_text(val):
    if pd.isna(val): return ""
    return str(val).strip().strip('"').replace('...', '').strip()

def upload_to_supabase(bucket, file_path, destination_path, content_type="audio/mpeg"):
    try:
        with open(file_path, 'rb') as f:
            supabase.storage.from_(bucket).upload(
                path=destination_path,
                file=f,
                file_options={"content-type": content_type, "upsert": "true"}
            )
        return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{destination_path}"
    except Exception as e:
        print(f"      ❌ Upload Error ({destination_path}): {e}")
        return None

def crop_audio(input_path, output_path, start_s, end_s):
    # Buffer: 50ms before, 100ms after for natural decay
    start = max(0, start_s - 0.05)
    duration = (end_s - start) + 0.1
    
    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-i", input_path,
        "-ss", str(start),
        "-t", str(duration),
        "-c", "copy",
        output_path
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"      ❌ FFmpeg Error: {e.stderr}")
        return False

# --- PREMIER GENERATION LOGIC ---

def generate_word_premier(word, voice_name, voice_id):
    # 1. Prepare Prompt with Carrier Phrase
    # Use simple text to avoid SSML issues, but enough to set context
    carrier = "The word is"
    text_input = f"{carrier} {word}." 
    
    # 2. Call API (With Timestamps)
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"
    headers = { "Content-Type": "application/json", "xi-api-key": ELEVENLABS_API_KEY }
    data = {
        "text": text_input,
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        if response.status_code != 200:
            print(f"      ❌ API Error: {response.text}")
            return "failed"
            
        json_response = response.json()
        audio_base64 = json_response.get("audio_base64")
        alignment = json_response.get("alignment") # keys: characters, character_start_times_seconds, ...
        
        if not audio_base64 or not alignment:
            print("      ❌ Invalid API Response")
            return "failed"

        # 3. Find Timing of Target Word
        # We look for the characters of the word AFTER the carrier phrase length
        # Carrier "The word is " is ~12 chars.
        # Let's search for the sequence of characters matching the word
        
        chars = alignment.get('characters', [])
        starts = alignment.get('character_start_times_seconds', [])
        ends = alignment.get('character_end_times_seconds', [])
        
        # Simple heuristic: The word usually appears at the end.
        # Let's find the contiguous sequence of chars that matches our word
        # This is a bit tricky with raw chars because of spaces/punctuation.
        
        # Better: We know the text ends with " {word}."
        # We can look at the last N characters where N is length of word.
        
        # Clean word for matching
        clean_target = word.lower().replace(" ", "")
        
        # Reconstruct full string from alignment to map indices
        full_aligned_text = "".join(chars).lower()
        
        # Find index where word starts
        # Search from right to handle "is" vs "is"
        # We expect it near the end.
        
        start_idx = full_aligned_text.rfind(clean_target)
        if start_idx == -1:
            print(f"      ⚠️ Could not find '{clean_target}' in alignment '{full_aligned_text}'")
            return "failed"
            
        end_idx = start_idx + len(clean_target) - 1
        
        # Get timestamps
        word_start_s = starts[start_idx]
        word_end_s = ends[end_idx]
        
        # 4. Save & Crop
        temp_raw = f"temp_raw_{uuid.uuid4()}.mp3"
        temp_crop = f"temp_crop_{uuid.uuid4()}.mp3"
        
        with open(temp_raw, 'wb') as f:
            f.write(base64.b64decode(audio_base64))
            
        if crop_audio(temp_raw, temp_crop, word_start_s, word_end_s):
            # 5. Upload
            final_path = f"words/{voice_name}/{slugify(word)}.mp3"
            upload_to_supabase("audio", temp_crop, final_path)
            # print(f"      ✅ Uploaded {word}")
            
            # Cleanup
            os.remove(temp_raw)
            os.remove(temp_crop)
            return "generated"
        else:
            return "failed"

    except Exception as e:
        print(f"      ❌ Exception: {e}")
        return "failed"

# --- MAIN BATCH LOOP ---

def process_words_batch():
    print("\n📦 Processing Word Pairs (Premier Strategy)...")
    if not os.path.exists(WORDS_CSV): return

    df = pd.read_csv(WORDS_CSV)
    df.columns = [c.strip() for c in df.columns]
    w1_col = next((c for c in df.columns if 'Word1' in c or 'Correct' in c), None)
    w2_col = next((c for c in df.columns if 'Word2' in c or 'Option' in c), None)

    words_to_process = set()
    for _, row in df.iterrows():
        words_to_process.add(clean_text(row[w1_col]))
        words_to_process.add(clean_text(row[w2_col]))

    word_list = sorted(list(words_to_process))
    
    for i, word in enumerate(word_list):
        if not word: continue
        if i % BATCH_SIZE == 0:
            print(f"\n   Processing batch {i//BATCH_SIZE + 1}...")
            
        for v_name, v_id in VOICES.items():
            # Check exist?
            # Skipping existence check for now to FORCE REGENERATION with better quality
            # If you want to skip, uncomment check_file_exists logic from previous scripts
            
            print(f"   🎙️ {word} ({v_name})...")
            generate_word_premier(word, v_name, v_id)
            time.sleep(0.2) 

if __name__ == "__main__":
    process_words_batch()
