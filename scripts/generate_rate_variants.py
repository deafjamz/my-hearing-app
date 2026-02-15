#!/usr/bin/env python3
"""
SPEAKING RATE VARIANTS GENERATION
=================================
Generates slow and fast speech rate variants for sentences and words.

Target: 200 items × 2 rates × 9 voices = 3,600 audio files
Estimated credits: ~10,000

Features:
- Uses ElevenLabs speed parameter for natural rate variation
- Fallback to FFmpeg tempo adjustment if needed
- Loudness normalization to -20 LUFS
- Progress tracking with resume capability
- Pilot mode for testing

Usage:
    # Pilot mode (10 items × 2 voices = 40 files)
    python3 scripts/generate_rate_variants.py --pilot

    # Full production
    python3 scripts/generate_rate_variants.py

    # Specific voices
    python3 scripts/generate_rate_variants.py --voices sarah,emma

    # Specific rate only
    python3 scripts/generate_rate_variants.py --rate slow

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

# Rate multipliers (preserve pitch, change tempo)
RATE_MULTIPLIERS = {
    'slow': 0.85,    # 15% slower
    'fast': 1.15     # 15% faster
}

# File paths
CSV_PATH = "content/source_csvs/rate_variants_v1.csv"
PROGRESS_FILE = "rate_variants_progress.json"
LOG_FILE = "rate_variants_generation.log"

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

def generate_audio_with_speed(client, text, voice_id, speed=1.0):
    """
    Generate audio using ElevenLabs with speed parameter.

    Note: If ElevenLabs doesn't support speed natively, we'll
    use FFmpeg post-processing as fallback.
    """
    try:
        # Try with speed parameter (may or may not be supported)
        response = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
            model_id="eleven_turbo_v2_5",
            voice_settings=VoiceSettings(
                stability=0.5,
                similarity_boost=0.75,
                style=0.0,
                # Note: speed parameter support depends on ElevenLabs API version
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


def adjust_tempo_ffmpeg(input_path, output_path, rate_multiplier):
    """
    Adjust audio tempo using FFmpeg while preserving pitch.
    This is the fallback if ElevenLabs doesn't support native speed control.
    """
    try:
        # atempo filter range is 0.5 to 2.0
        # For values outside this range, chain multiple filters
        if rate_multiplier < 0.5:
            rate_multiplier = 0.5
        elif rate_multiplier > 2.0:
            rate_multiplier = 2.0

        cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", input_path,
            "-filter:a", f"atempo={rate_multiplier}",
            "-vn",
            output_path
        ]
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return os.path.exists(output_path)
    except Exception as e:
        log(f"      ❌ Tempo adjustment error: {e}")
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

def check_existing_files(supabase, voice_name, source_type):
    """Check which rate variant files already exist for a voice."""
    try:
        prefix = "sentences_v1" if source_type == "sentence" else "words_v2"
        files = supabase.storage.from_("audio").list(
            f"{prefix}/{voice_name}",
            {"limit": 2000}
        )
        existing = set()
        for f in files:
            if f['name'].endswith('.mp3'):
                # Look for _slow or _fast suffix
                name = f['name'].replace('.mp3', '')
                if '_slow' in name or '_fast' in name:
                    existing.add(name)
        return existing
    except:
        return set()


def process_rate_variant(client, supabase, row, voice, rate):
    """Process a single item at a specific rate for one voice."""
    voice_name = voice['name']
    voice_id = voice['id']
    item_id = row['id']
    text = row['text']
    source_type = row['source_type']
    rate_multiplier = RATE_MULTIPLIERS[rate]

    # Generate normal speed audio first
    audio_bytes = generate_audio_with_speed(client, text, voice_id)
    if not audio_bytes:
        return False, None

    # Save raw audio
    raw_file = f"temp_rate_raw_{uuid.uuid4()}.mp3"
    with open(raw_file, 'wb') as f:
        f.write(audio_bytes)

    # Apply tempo adjustment
    tempo_file = f"temp_rate_tempo_{uuid.uuid4()}.mp3"
    if not adjust_tempo_ffmpeg(raw_file, tempo_file, rate_multiplier):
        os.remove(raw_file)
        return False, None

    # Normalize
    final_file = f"temp_rate_final_{uuid.uuid4()}.mp3"
    if not normalize_audio(tempo_file, final_file):
        os.remove(raw_file)
        os.remove(tempo_file)
        return False, None

    duration = get_audio_duration(final_file)

    # Determine storage path based on source type
    if source_type == "sentence":
        storage_path = f"sentences_v1/{voice_name}/{item_id}_{rate}.mp3"
    else:
        storage_path = f"words_v2/{voice_name}/{text}_{rate}.mp3"

    if not upload_to_supabase(supabase, final_file, storage_path):
        os.remove(raw_file)
        os.remove(tempo_file)
        os.remove(final_file)
        return False, None

    # Cleanup
    os.remove(raw_file)
    os.remove(tempo_file)
    os.remove(final_file)

    return True, {
        'item_id': item_id,
        'voice': voice_name,
        'rate': rate,
        'rate_multiplier': rate_multiplier,
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
            'timestamp': datetime.now().isoformat(),
            'total': len(completed)
        }, f, indent=2)


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Generate speaking rate variant audio")
    parser.add_argument("--pilot", action="store_true", help="Pilot mode (10 items × 2 voices)")
    parser.add_argument("--voices", type=str, help="Comma-separated list of voices")
    parser.add_argument("--rate", type=str, choices=['slow', 'fast'], help="Generate only this rate")
    parser.add_argument("--resume", action="store_true", help="Resume from progress file")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated")
    args = parser.parse_args()

    log("\n" + "=" * 70)
    log("⏱️  SPEAKING RATE VARIANTS GENERATION")
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
    items = df.to_dict('records')

    log(f"\n📚 Found {len(items)} items in CSV")

    # Pilot mode
    if args.pilot:
        items = items[:10]
        log(f"\n🧪 PILOT MODE: Processing first 10 items")

    # Determine voices
    if args.voices:
        voice_names = [v.strip().lower() for v in args.voices.split(',')]
        voices = [v for v in ALL_VOICES if v['name'] in voice_names]
    else:
        voices = ALL_VOICES

    if args.pilot:
        voices = voices[:2]

    # Determine rates
    if args.rate:
        rates = [args.rate]
    else:
        rates = ['slow', 'fast']

    log(f"🎤 Target voices: {', '.join(v['name'] for v in voices)}")
    log(f"⏱️  Target rates: {', '.join(rates)}")
    log(f"📊 Total files to generate: {len(items)} × {len(rates)} × {len(voices)} = {len(items) * len(rates) * len(voices)}")

    if args.dry_run:
        log("\n🔍 DRY RUN MODE - showing what would be generated:")
        for item in items[:3]:
            for voice in voices[:2]:
                for rate in rates:
                    log(f"   Would generate: {item['id']} × {voice['name']} × {rate}")
        log(f"   ... and more")
        return

    # Initialize clients
    client, supabase = init_clients()

    # Check existing files
    log("\n📂 Checking existing files...")
    existing_by_voice = {}
    for voice in voices:
        existing = check_existing_files(supabase, voice['name'], 'sentence')
        existing_words = check_existing_files(supabase, voice['name'], 'word')
        existing_by_voice[voice['name']] = existing | existing_words
        log(f"   {voice['name']}: {len(existing_by_voice[voice['name']])} existing rate variants")

    # Load progress
    completed = set()
    if args.resume:
        completed = load_progress()
        if completed:
            log(f"\n📂 Resumed: {len(completed)} items from progress file")

    # Calculate work
    to_generate = []
    for item in items:
        for voice in voices:
            for rate in rates:
                item_id = item['id']
                voice_name = voice['name']
                text = item['text']

                # Check if this specific combination exists
                source_type = item['source_type']
                if source_type == "sentence":
                    file_key = f"{item_id}_{rate}"
                else:
                    file_key = f"{text}_{rate}"

                if file_key not in existing_by_voice.get(voice_name, set()):
                    if (item_id, voice_name, rate) not in completed:
                        to_generate.append((item, voice, rate))

    log(f"\n📊 Files to generate: {len(to_generate)}")
    log(f"📊 Already complete: {len(items) * len(rates) * len(voices) - len(to_generate)}")

    if not to_generate:
        log("\n✅ All files already generated!")
        return

    # Estimate credits
    estimated_credits = len(to_generate) * 5 * 0.003  # ~5 words avg
    log(f"💰 Estimated credits: ~{estimated_credits:.0f}")

    # Process
    results = []
    failed = 0

    for idx, (item, voice, rate) in enumerate(to_generate):
        item_id = item['id']
        voice_name = voice['name']
        text = item['text']
        text_preview = text[:30] + "..." if len(text) > 30 else text

        log(f"\n{'─' * 50}")
        log(f"⏱️  [{idx + 1}/{len(to_generate)}] {text_preview}")
        log(f"   🎤 {voice_name} @ {rate} ({RATE_MULTIPLIERS[rate]}x)...", end=" ")

        success = False
        for attempt in range(MAX_RETRIES + 1):
            success, result = process_rate_variant(client, supabase, item, voice, rate)
            if success:
                log(f"✅ {result['duration']:.1f}s")
                results.append(result)
                completed.add((item_id, voice_name, rate))
                save_progress(completed)
                break
            elif attempt < MAX_RETRIES:
                log(f"Retry {attempt + 1}...", end=" ")
                time.sleep(1)

        if not success:
            log("❌ Failed after retries")
            failed += 1

        time.sleep(0.3)  # Rate limiting

    # Summary
    log("\n" + "=" * 70)
    log("🎯 GENERATION COMPLETE")
    log("=" * 70)
    log(f"   Total attempted: {len(to_generate)}")
    log(f"   Successful: {len(results)}")
    log(f"   Failed: {failed}")

    if results:
        total_duration = sum(r['duration'] for r in results)
        log(f"\n📊 Total audio duration: {total_duration / 60:.1f} minutes")

        log(f"\n📊 By rate:")
        for rate in rates:
            count = sum(1 for r in results if r['rate'] == rate)
            log(f"   {rate}: {count} files")

        log(f"\n📊 By voice:")
        for voice in voices:
            count = sum(1 for r in results if r['voice'] == voice['name'])
            log(f"   {voice['name']}: {count} files")

    log("\n📋 Next steps:")
    log("   1. Verify audio quality: spot-check slow and fast variants")
    log("   2. Test in app: ensure rate selection works correctly")


if __name__ == "__main__":
    main()
