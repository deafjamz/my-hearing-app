#!/usr/bin/env python3
"""
SENTENCE GENERATION - ALL 9 VOICES
==================================
Generates sentence audio for all active voices in the clinical roster.

Target: 628 sentences × 8 voices = 5,024 audio files
(Sarah already has 618, so we generate 10 missing + 628 × 7 other voices)

Voices: emma, bill, michael, alice, daniel, matilda, charlie, aravind
(sarah mostly complete - will fill gaps)

Estimated Credits: ~10,000-15,000 (with retries)

Usage:
    # Pilot mode (first 10 sentences)
    python3 scripts/generate_sentences_all_voices.py --pilot

    # Full production
    python3 scripts/generate_sentences_all_voices.py

Created: 2026-01-19
"""

import os
import sys
import subprocess
import uuid
import time
import json
import argparse
import pandas as pd
from datetime import datetime
from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
from supabase import create_client, Client

# =============================================================================
# CONFIGURATION
# =============================================================================

def get_key_from_env_file(key_name, file_path=".env"):
    """Read key from .env file."""
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                if key.strip() == key_name:
                    return value.strip()
    return None


# Credentials
ELEVENLABS_API_KEY = get_key_from_env_file("ELEVENLABS_API_KEY")
SUPABASE_URL = get_key_from_env_file("SUPABASE_URL")
SUPABASE_KEY = get_key_from_env_file("SUPABASE_SERVICE_ROLE_KEY")

# 9-Voice Clinical Roster (from docs/VOICE_LIBRARY.md)
# Excluding deprecated marcus and david
ALL_VOICES = [
    {"name": "sarah",   "id": "EXAVITQu4vr4xnSDxMaL", "gender": "female", "region": "US"},
    {"name": "emma",    "id": "OYTbf65OHHFELVut7v2H", "gender": "female", "region": "US"},
    {"name": "bill",    "id": "pqHfZKP75CvOlQylNhV4", "gender": "male",   "region": "US"},
    {"name": "michael", "id": "flq6f7yk4E4fJM5XTYuZ", "gender": "male",   "region": "US"},
    {"name": "alice",   "id": "Xb7hH8MSUJpSbSDYk0k2", "gender": "female", "region": "UK"},
    {"name": "daniel",  "id": "onwK4e9ZLuTAKqWW03F9", "gender": "male",   "region": "UK"},
    {"name": "matilda", "id": "XrExE9yKIg1WjnnlVkGX", "gender": "female", "region": "AU"},
    {"name": "charlie", "id": "IKne3meq5aSn9XLyUdCD", "gender": "male",   "region": "AU"},
    {"name": "aravind", "id": "5Q0t7uMcjvnagumLfvZi", "gender": "male",   "region": "IN"},
]

# File paths
CSV_PATH = "content/source_csvs/master_sentences.csv"
PROGRESS_FILE = "sentence_generation_progress.json"
LOG_FILE = "sentence_generation.log"

# Audio settings (from docs/rules/00_MASTER_RULES.md)
TARGET_LUFS = -20.0
MIN_DURATION_SEC = 0.8
MAX_RETRIES = 2

# =============================================================================
# INITIALIZATION
# =============================================================================

if not all([ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing credentials in .env file.")
    print("   Required: ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
    sys.exit(1)

# Initialize clients
client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print("✅ ElevenLabs and Supabase clients initialized.")

# =============================================================================
# LOGGING
# =============================================================================

def log(message, end="\n"):
    """Write to both console and log file."""
    print(message, end=end, flush=True)
    with open(LOG_FILE, 'a') as f:
        f.write(f"{datetime.now().isoformat()} | {message}\n")

# =============================================================================
# AUDIO GENERATION
# =============================================================================

def generate_sentence_audio(sentence_text, voice_id):
    """Generate audio for a full sentence using ElevenLabs."""
    try:
        response = client.text_to_speech.convert(
            voice_id=voice_id,
            text=sentence_text,
            model_id="eleven_turbo_v2_5",
            voice_settings=VoiceSettings(
                stability=0.5,
                similarity_boost=0.75,
                style=0.0
            )
        )

        audio_chunks = []
        for chunk in response:
            if isinstance(chunk, bytes):
                audio_chunks.append(chunk)

        if not audio_chunks:
            return None

        return b''.join(audio_chunks)

    except Exception as e:
        log(f"      ❌ Generation error: {e}")
        return None


def get_audio_duration(audio_path):
    """Get audio duration using ffprobe."""
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except:
        return 0.0


def normalize_audio(input_path, output_path):
    """Normalize audio to target LUFS (-20 dB per clinical standards)."""
    try:
        cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", input_path,
            "-af", f"loudnorm=I={TARGET_LUFS}:TP=-1.5:LRA=11",
            "-ar", "44100",
            "-b:a", "192k",
            output_path
        ]
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return os.path.exists(output_path)
    except Exception as e:
        log(f"      ❌ Normalization error: {e}")
        return False


def check_audio_quality(audio_path):
    """Basic quality checks for sentence audio."""
    duration = get_audio_duration(audio_path)

    issues = []
    if duration < MIN_DURATION_SEC:
        issues.append(f"Too short: {duration:.2f}s < {MIN_DURATION_SEC}s")
    if duration > 30.0:
        issues.append(f"Too long: {duration:.2f}s > 30s")

    return len(issues) == 0, issues, duration


def upload_to_supabase(local_path, storage_path):
    """Upload file to Supabase storage."""
    try:
        with open(local_path, 'rb') as f:
            file_data = f.read()

        supabase.storage.from_("audio").upload(
            storage_path,
            file_data,
            {"content-type": "audio/mpeg", "upsert": "true"}
        )
        return True
    except Exception as e:
        log(f"      ❌ Upload error: {e}")
        return False


# =============================================================================
# PROCESSING
# =============================================================================

def check_existing_files(voice_name):
    """Check which sentence files already exist for a voice."""
    try:
        files = supabase.storage.from_("audio").list(
            f"sentences_v1/{voice_name}",
            {"limit": 1000}
        )
        existing = set()
        for f in files:
            # Extract sentence ID from filename like "sentence_123.mp3"
            name = f['name'].replace('.mp3', '')
            if name.startswith('sentence_'):
                try:
                    sentence_id = int(name.replace('sentence_', ''))
                    existing.add(sentence_id)
                except ValueError:
                    pass
        return existing
    except:
        return set()


def process_sentence(row, sentence_id, voice):
    """Process a single sentence for one voice."""
    voice_name = voice['name']
    voice_id = voice['id']
    sentence_text = row['sentence_text']

    # Generate audio
    audio_bytes = generate_sentence_audio(sentence_text, voice_id)
    if not audio_bytes:
        return False, None

    # Save raw audio
    raw_file = f"temp_sentence_raw_{uuid.uuid4()}.mp3"
    with open(raw_file, 'wb') as f:
        f.write(audio_bytes)

    # Normalize
    final_file = f"temp_sentence_final_{uuid.uuid4()}.mp3"
    if not normalize_audio(raw_file, final_file):
        os.remove(raw_file)
        return False, None

    # Quality check
    passed, issues, duration = check_audio_quality(final_file)
    if not passed:
        log(f"      ⚠️  Quality issues: {', '.join(issues)}")
        os.remove(raw_file)
        os.remove(final_file)
        return False, None

    # Upload
    storage_path = f"sentences_v1/{voice_name}/sentence_{sentence_id}.mp3"
    if not upload_to_supabase(final_file, storage_path):
        os.remove(raw_file)
        os.remove(final_file)
        return False, None

    # Cleanup
    os.remove(raw_file)
    os.remove(final_file)

    return True, {
        'sentence_id': sentence_id,
        'voice': voice_name,
        'duration': duration,
        'storage_path': storage_path
    }


def load_progress():
    """Load progress from file."""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            data = json.load(f)
            return set(tuple(item) for item in data.get('completed', []))
    return set()


def save_progress(completed):
    """Save progress to file."""
    with open(PROGRESS_FILE, 'w') as f:
        json.dump({
            'completed': [list(item) for item in completed],
            'timestamp': datetime.now().isoformat()
        }, f, indent=2)


# =============================================================================
# MAIN
# =============================================================================

def main(pilot_mode=False, voices_filter=None):
    """Main generation loop."""
    log("\n" + "=" * 70)
    log("🎤 SENTENCE GENERATION - ALL VOICES")
    log("=" * 70)

    # Load CSV
    if not os.path.exists(CSV_PATH):
        log(f"❌ CSV not found: {CSV_PATH}")
        return

    df = pd.read_csv(CSV_PATH)
    total_sentences = len(df)

    if pilot_mode:
        df = df.head(10)
        log(f"\n🧪 PILOT MODE: Processing first 10 sentences\n")
    else:
        log(f"\n🚀 PRODUCTION MODE: Processing {total_sentences} sentences\n")

    # Determine which voices to process
    if voices_filter:
        voices = [v for v in ALL_VOICES if v['name'] in voices_filter]
    else:
        voices = ALL_VOICES

    log(f"Target voices: {', '.join(v['name'] for v in voices)}")
    log(f"Total files to generate: {len(df) * len(voices)}")

    # Check existing files
    log("\n📂 Checking existing files...")
    existing_by_voice = {}
    for voice in voices:
        existing = check_existing_files(voice['name'])
        existing_by_voice[voice['name']] = existing
        log(f"   {voice['name']}: {len(existing)} existing files")

    # Load progress
    completed = load_progress()
    if completed:
        log(f"\n📂 Resumed: {len(completed)} items from progress file")

    # Process
    results = []
    total = len(df) * len(voices)
    processed = 0
    skipped = 0
    failed = 0

    for idx, row in df.iterrows():
        sentence_id = idx + 1
        sentence_preview = row['sentence_text'][:50] + "..." if len(row['sentence_text']) > 50 else row['sentence_text']

        log(f"\n{'─' * 50}")
        log(f"📌 Sentence {sentence_id}/{len(df)}: {sentence_preview}")

        for voice in voices:
            voice_name = voice['name']

            # Skip if already in Supabase
            if sentence_id in existing_by_voice.get(voice_name, set()):
                log(f"   ⏭️  {voice_name}: Already exists")
                skipped += 1
                processed += 1
                continue

            # Skip if in progress file
            if (sentence_id, voice_name) in completed:
                log(f"   ⏭️  {voice_name}: Skipped (progress file)")
                skipped += 1
                processed += 1
                continue

            log(f"   🎤 {voice_name}...", end=" ")

            # Try with retries
            success = False
            for attempt in range(MAX_RETRIES + 1):
                success, result = process_sentence(row, sentence_id, voice)
                if success:
                    log(f"✅ {result['duration']:.1f}s → {result['storage_path']}")
                    results.append(result)
                    completed.add((sentence_id, voice_name))
                    save_progress(completed)
                    break
                elif attempt < MAX_RETRIES:
                    log(f"Retry {attempt + 1}...", end=" ")
                    time.sleep(1)

            if not success:
                log("❌ Failed after retries")
                failed += 1

            processed += 1
            time.sleep(0.3)  # Rate limiting

    # Summary
    log("\n" + "=" * 70)
    log("🎯 GENERATION COMPLETE")
    log("=" * 70)
    log(f"   Total processed: {processed}")
    log(f"   Successful: {len(results)}")
    log(f"   Skipped (existing): {skipped}")
    log(f"   Failed: {failed}")

    if results:
        log(f"\n📊 Results by voice:")
        for voice in voices:
            count = sum(1 for r in results if r['voice'] == voice['name'])
            log(f"   {voice['name']}: {count} new files")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate sentence audio for all voices")
    parser.add_argument("--pilot", action="store_true", help="Pilot mode (first 10 sentences)")
    parser.add_argument("--voices", type=str, help="Comma-separated list of voices to process")
    args = parser.parse_args()

    voices_filter = None
    if args.voices:
        voices_filter = [v.strip().lower() for v in args.voices.split(',')]

    # Check ffmpeg
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        print("✅ ffmpeg available")
    except FileNotFoundError:
        print("❌ ffmpeg not found. Install via: brew install ffmpeg")
        sys.exit(1)

    main(pilot_mode=args.pilot, voices_filter=voices_filter)
