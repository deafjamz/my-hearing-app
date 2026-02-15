#!/usr/bin/env python3
"""
PHONEME DRILL PACKS GENERATION
==============================
Generates audio for phoneme drill minimal pairs across 9 voices.

Target: 500 pairs × 2 words × 9 voices = 9,000 audio files
Estimated credits: ~20,000

Features:
- Generates both words in each minimal pair
- Organizes by drill pack (contrast type)
- Loudness normalization to -20 LUFS
- Progress tracking with resume capability
- Pilot mode for testing

Usage:
    # Pilot mode (10 pairs × 2 voices = 40 files)
    python3 scripts/generate_phoneme_drills.py --pilot

    # Full production
    python3 scripts/generate_phoneme_drills.py

    # Specific voices
    python3 scripts/generate_phoneme_drills.py --voices sarah,emma

    # Specific drill pack
    python3 scripts/generate_phoneme_drills.py --pack pack_p_vs_b

Created: 2026-01-22
"""

import os
import sys
import json
import uuid
import time
import argparse
import subprocess
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

# 9-Voice Clinical Roster
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
CSV_PATH = "content/source_csvs/phoneme_drills_v1.csv"
PROGRESS_FILE = "phoneme_drills_progress.json"
LOG_FILE = "phoneme_drills_generation.log"

# Audio settings
TARGET_LUFS = -20.0
MIN_DURATION_SEC = 0.3
MAX_RETRIES = 2

# =============================================================================
# INITIALIZATION
# =============================================================================

def init_clients():
    """Initialize ElevenLabs and Supabase clients."""
    if not all([ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
        print("❌ Error: Missing credentials in .env file.")
        print("   Required: ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ ElevenLabs and Supabase clients initialized.")
    return client, supabase

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

def generate_word_audio(client, word, voice_id):
    """Generate audio for a single word using carrier phrase method."""
    # Use carrier phrase for natural pronunciation
    carrier_text = f"Say {word}."

    try:
        response = client.text_to_speech.convert(
            voice_id=voice_id,
            text=carrier_text,
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


def extract_target_word(input_path, output_path):
    """
    Extract the target word from carrier phrase audio.
    Uses silence detection to find the word after "Say".
    """
    try:
        # First, detect silence to find word boundaries
        # Then extract the portion after "Say " (roughly last 60% of audio)
        cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", input_path,
            "-af", "atrim=start=0.4,silenceremove=start_periods=1:start_silence=0.1:start_threshold=-50dB",
            "-ar", "44100",
            output_path
        ]
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return os.path.exists(output_path) and os.path.getsize(output_path) > 1000
    except Exception as e:
        # Fallback: just use the full audio
        try:
            subprocess.run(["cp", input_path, output_path], check=True)
            return True
        except:
            return False


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
    """Normalize audio to target LUFS."""
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


def upload_to_supabase(supabase, local_path, storage_path):
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

def check_existing_files(supabase, voice_name, pack_id):
    """Check which drill files already exist for a voice and pack."""
    try:
        files = supabase.storage.from_("audio").list(
            f"drills/{voice_name}/{pack_id}",
            {"limit": 500}
        )
        existing = set()
        for f in files:
            if f['name'].endswith('.mp3'):
                name = f['name'].replace('.mp3', '')
                existing.add(name)
        return existing
    except:
        return set()


def process_drill_pair(client, supabase, row, voice):
    """Process a single drill pair for one voice (generates 2 files)."""
    voice_name = voice['name']
    voice_id = voice['id']
    drill_id = row['id']
    pack_id = row['drill_pack_id']
    word_1 = row['word_1']
    word_2 = row['word_2']

    results = []

    # Generate word_1 audio
    log(f"w1:{word_1}...", end=" ")

    audio_bytes = generate_word_audio(client, word_1, voice_id)
    if not audio_bytes:
        return False, []

    raw_file = f"temp_drill_raw_{uuid.uuid4()}.mp3"
    with open(raw_file, 'wb') as f:
        f.write(audio_bytes)

    extracted_file = f"temp_drill_extracted_{uuid.uuid4()}.mp3"
    if not extract_target_word(raw_file, extracted_file):
        os.remove(raw_file)
        return False, []

    final_file = f"temp_drill_final_{uuid.uuid4()}.mp3"
    if not normalize_audio(extracted_file, final_file):
        os.remove(raw_file)
        os.remove(extracted_file)
        return False, []

    duration = get_audio_duration(final_file)
    storage_path = f"drills/{voice_name}/{pack_id}/{drill_id}_{word_1}.mp3"

    if not upload_to_supabase(supabase, final_file, storage_path):
        os.remove(raw_file)
        os.remove(extracted_file)
        os.remove(final_file)
        return False, []

    os.remove(raw_file)
    os.remove(extracted_file)
    os.remove(final_file)

    results.append({
        'drill_id': drill_id,
        'word': word_1,
        'word_num': 1,
        'voice': voice_name,
        'pack_id': pack_id,
        'duration': duration,
        'storage_path': storage_path
    })
    log(f"✓", end=" | ")

    # Generate word_2 audio
    log(f"w2:{word_2}...", end=" ")

    audio_bytes = generate_word_audio(client, word_2, voice_id)
    if not audio_bytes:
        return False, results

    raw_file = f"temp_drill_raw_{uuid.uuid4()}.mp3"
    with open(raw_file, 'wb') as f:
        f.write(audio_bytes)

    extracted_file = f"temp_drill_extracted_{uuid.uuid4()}.mp3"
    if not extract_target_word(raw_file, extracted_file):
        os.remove(raw_file)
        return False, results

    final_file = f"temp_drill_final_{uuid.uuid4()}.mp3"
    if not normalize_audio(extracted_file, final_file):
        os.remove(raw_file)
        os.remove(extracted_file)
        return False, results

    duration = get_audio_duration(final_file)
    storage_path = f"drills/{voice_name}/{pack_id}/{drill_id}_{word_2}.mp3"

    if not upload_to_supabase(supabase, final_file, storage_path):
        os.remove(raw_file)
        os.remove(extracted_file)
        os.remove(final_file)
        return False, results

    os.remove(raw_file)
    os.remove(extracted_file)
    os.remove(final_file)

    results.append({
        'drill_id': drill_id,
        'word': word_2,
        'word_num': 2,
        'voice': voice_name,
        'pack_id': pack_id,
        'duration': duration,
        'storage_path': storage_path
    })
    log(f"✓")

    return True, results


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
            'timestamp': datetime.now().isoformat(),
            'total': len(completed)
        }, f, indent=2)


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Generate phoneme drill audio for all voices")
    parser.add_argument("--pilot", action="store_true", help="Pilot mode (10 pairs × 2 voices)")
    parser.add_argument("--voices", type=str, help="Comma-separated list of voices")
    parser.add_argument("--pack", type=str, help="Filter by drill pack ID")
    parser.add_argument("--resume", action="store_true", help="Resume from progress file")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated")
    args = parser.parse_args()

    log("\n" + "=" * 70)
    log("🎯 PHONEME DRILL PACKS GENERATION")
    log("=" * 70)

    # Check ffmpeg
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        log("✅ ffmpeg available")
    except FileNotFoundError:
        log("❌ ffmpeg not found. Install via: brew install ffmpeg")
        sys.exit(1)

    # Load CSV
    if not os.path.exists(CSV_PATH):
        log(f"❌ CSV not found: {CSV_PATH}")
        sys.exit(1)

    df = pd.read_csv(CSV_PATH)
    drills = df.to_dict('records')

    # Filter by pack
    if args.pack:
        drills = [d for d in drills if d['drill_pack_id'] == args.pack]
        log(f"📦 Filtered to pack: {args.pack} ({len(drills)} pairs)")

    log(f"\n📚 Found {len(drills)} drill pairs in CSV")

    # Show pack breakdown
    packs = {}
    for d in drills:
        pack = d['drill_pack_id']
        packs[pack] = packs.get(pack, 0) + 1
    log(f"\n📦 Drill packs:")
    for pack, count in sorted(packs.items()):
        log(f"   {pack}: {count} pairs")

    # Pilot mode
    if args.pilot:
        drills = drills[:10]
        log(f"\n🧪 PILOT MODE: Processing first 10 pairs")

    # Determine voices
    if args.voices:
        voice_names = [v.strip().lower() for v in args.voices.split(',')]
        voices = [v for v in ALL_VOICES if v['name'] in voice_names]
    else:
        voices = ALL_VOICES

    if args.pilot:
        voices = voices[:2]

    log(f"\n🎤 Target voices: {', '.join(v['name'] for v in voices)}")
    log(f"📊 Total files to generate: {len(drills)} × 2 × {len(voices)} = {len(drills) * 2 * len(voices)}")

    if args.dry_run:
        log("\n🔍 DRY RUN MODE - showing what would be generated:")
        for drill in drills[:3]:
            for voice in voices[:2]:
                log(f"   Would generate: {drill['id']} ({drill['word_1']}/{drill['word_2']}) × {voice['name']}")
        log(f"   ... and more")
        return

    # Initialize clients
    client, supabase = init_clients()

    # Check existing files
    log("\n📂 Checking existing files...")
    existing_by_voice_pack = {}
    for voice in voices:
        for pack in packs.keys():
            key = (voice['name'], pack)
            existing = check_existing_files(supabase, voice['name'], pack)
            existing_by_voice_pack[key] = existing

    total_existing = sum(len(e) for e in existing_by_voice_pack.values())
    log(f"   Total existing files: {total_existing}")

    # Load progress
    completed = set()
    if args.resume:
        completed = load_progress()
        if completed:
            log(f"\n📂 Resumed: {len(completed)} items from progress file")

    # Calculate work
    to_generate = []
    for drill in drills:
        for voice in voices:
            drill_id = drill['id']
            voice_name = voice['name']
            pack_id = drill['drill_pack_id']
            word_1 = drill['word_1']
            word_2 = drill['word_2']

            key = (voice_name, pack_id)
            existing = existing_by_voice_pack.get(key, set())

            # Check if both words exist
            w1_key = f"{drill_id}_{word_1}"
            w2_key = f"{drill_id}_{word_2}"

            if w1_key not in existing or w2_key not in existing:
                if (drill_id, voice_name) not in completed:
                    to_generate.append((drill, voice))

    log(f"\n📊 Pairs to generate: {len(to_generate)}")
    log(f"📊 Already complete: {len(drills) * len(voices) - len(to_generate)}")

    if not to_generate:
        log("\n✅ All files already generated!")
        return

    # Estimate credits (2 words × ~3 words with carrier)
    estimated_credits = len(to_generate) * 2 * 3 * 0.003
    log(f"💰 Estimated credits: ~{estimated_credits:.0f}")

    # Process
    results = []
    failed = 0

    for idx, (drill, voice) in enumerate(to_generate):
        drill_id = drill['id']
        voice_name = voice['name']
        pack_id = drill['drill_pack_id']
        pack_name = drill['pack_name']

        log(f"\n{'─' * 50}")
        log(f"🎯 [{idx + 1}/{len(to_generate)}] {drill_id}")
        log(f"   📦 {pack_name} | 🎤 {voice_name}: ", end="")

        success = False
        for attempt in range(MAX_RETRIES + 1):
            success, result = process_drill_pair(client, supabase, drill, voice)
            if success:
                results.extend(result)
                completed.add((drill_id, voice_name))
                save_progress(completed)
                break
            elif attempt < MAX_RETRIES:
                log(f"Retry {attempt + 1}...", end=" ")
                time.sleep(2)

        if not success:
            log("❌ Failed after retries")
            failed += 1

        time.sleep(0.3)  # Rate limiting

    # Summary
    log("\n" + "=" * 70)
    log("🎯 GENERATION COMPLETE")
    log("=" * 70)
    log(f"   Total pairs attempted: {len(to_generate)}")
    log(f"   Files generated: {len(results)}")
    log(f"   Pairs failed: {failed}")

    if results:
        total_duration = sum(r['duration'] for r in results)
        log(f"\n📊 Total audio duration: {total_duration / 60:.1f} minutes")

        log(f"\n📊 By voice:")
        for voice in voices:
            count = sum(1 for r in results if r['voice'] == voice['name'])
            log(f"   {voice['name']}: {count} files")

        log(f"\n📊 By pack:")
        for pack in packs.keys():
            count = sum(1 for r in results if r['pack_id'] == pack)
            if count > 0:
                log(f"   {pack}: {count} files")

    log("\n📋 Next steps:")
    log("   1. Run ingestion script: python3 scripts/ingest_phoneme_drills.py")
    log("   2. Verify in app: test drill exercises")


if __name__ == "__main__":
    main()
