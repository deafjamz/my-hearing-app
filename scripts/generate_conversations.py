#!/usr/bin/env python3
"""
CONVERSATION AUDIO GENERATION
=============================
Generates audio for conversational Q&A pairs across 9 voices.

Target: 200 pairs × 2 files (prompt + response) × 9 voices = 3,600 audio files
Estimated credits: ~15,000

Features:
- Generates both prompt (question) and response (answer) audio
- Loudness normalization to -20 LUFS
- Progress tracking with resume capability
- Pilot mode for testing

Usage:
    # Pilot mode (10 pairs × 2 voices = 40 files)
    python3 scripts/generate_conversations.py --pilot

    # Full production
    python3 scripts/generate_conversations.py

    # Specific voices
    python3 scripts/generate_conversations.py --voices sarah,emma

    # Specific category
    python3 scripts/generate_conversations.py --category medical

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
CSV_PATH = "content/source_csvs/conversations_v1.csv"
PROGRESS_FILE = "conversation_generation_progress.json"
LOG_FILE = "conversation_generation.log"

# Audio settings
TARGET_LUFS = -20.0
MIN_DURATION_SEC = 0.5
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

def generate_audio(client, text, voice_id):
    """Generate audio using ElevenLabs."""
    try:
        response = client.text_to_speech.convert(
            voice_id=voice_id,
            text=text,
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

def check_existing_files(supabase, voice_name):
    """Check which conversation files already exist for a voice."""
    try:
        files = supabase.storage.from_("audio").list(
            f"conversations/{voice_name}",
            {"limit": 1000}
        )
        existing = set()
        for f in files:
            if f['name'].endswith('.mp3'):
                # Extract conversation ID and type (prompt/response)
                name = f['name'].replace('.mp3', '')
                existing.add(name)
        return existing
    except:
        return set()


def process_conversation(client, supabase, row, voice):
    """Process a single conversation pair for one voice (generates 2 files)."""
    voice_name = voice['name']
    voice_id = voice['id']
    conv_id = row['id']
    prompt_text = row['prompt_text']
    response_text = row['response_text']

    results = []

    # Generate prompt audio
    prompt_key = f"{conv_id}_prompt"
    log(f"      Prompt...", end=" ")

    audio_bytes = generate_audio(client, prompt_text, voice_id)
    if not audio_bytes:
        return False, []

    raw_file = f"temp_conv_raw_{uuid.uuid4()}.mp3"
    with open(raw_file, 'wb') as f:
        f.write(audio_bytes)

    final_file = f"temp_conv_final_{uuid.uuid4()}.mp3"
    if not normalize_audio(raw_file, final_file):
        os.remove(raw_file)
        return False, []

    duration = get_audio_duration(final_file)
    storage_path = f"conversations/{voice_name}/{prompt_key}.mp3"

    if not upload_to_supabase(supabase, final_file, storage_path):
        os.remove(raw_file)
        os.remove(final_file)
        return False, []

    os.remove(raw_file)
    os.remove(final_file)

    results.append({
        'conv_id': conv_id,
        'type': 'prompt',
        'voice': voice_name,
        'duration': duration,
        'storage_path': storage_path
    })
    log(f"✓ {duration:.1f}s", end=" | ")

    # Generate response audio
    response_key = f"{conv_id}_response"
    log(f"Response...", end=" ")

    audio_bytes = generate_audio(client, response_text, voice_id)
    if not audio_bytes:
        return False, results

    raw_file = f"temp_conv_raw_{uuid.uuid4()}.mp3"
    with open(raw_file, 'wb') as f:
        f.write(audio_bytes)

    final_file = f"temp_conv_final_{uuid.uuid4()}.mp3"
    if not normalize_audio(raw_file, final_file):
        os.remove(raw_file)
        return False, results

    duration = get_audio_duration(final_file)
    storage_path = f"conversations/{voice_name}/{response_key}.mp3"

    if not upload_to_supabase(supabase, final_file, storage_path):
        os.remove(raw_file)
        os.remove(final_file)
        return False, results

    os.remove(raw_file)
    os.remove(final_file)

    results.append({
        'conv_id': conv_id,
        'type': 'response',
        'voice': voice_name,
        'duration': duration,
        'storage_path': storage_path
    })
    log(f"✓ {duration:.1f}s")

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
    parser = argparse.ArgumentParser(description="Generate conversation audio for all voices")
    parser.add_argument("--pilot", action="store_true", help="Pilot mode (10 pairs × 2 voices)")
    parser.add_argument("--voices", type=str, help="Comma-separated list of voices")
    parser.add_argument("--category", type=str, help="Filter by category")
    parser.add_argument("--resume", action="store_true", help="Resume from progress file")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated")
    args = parser.parse_args()

    log("\n" + "=" * 70)
    log("💬 CONVERSATION AUDIO GENERATION")
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
    conversations = df.to_dict('records')

    # Filter by category
    if args.category:
        conversations = [c for c in conversations if c['category'] == args.category]
        log(f"📂 Filtered to category: {args.category} ({len(conversations)} pairs)")

    log(f"\n📚 Found {len(conversations)} conversation pairs in CSV")

    # Pilot mode
    if args.pilot:
        conversations = conversations[:10]
        log(f"\n🧪 PILOT MODE: Processing first 10 pairs")

    # Determine voices
    if args.voices:
        voice_names = [v.strip().lower() for v in args.voices.split(',')]
        voices = [v for v in ALL_VOICES if v['name'] in voice_names]
    else:
        voices = ALL_VOICES

    if args.pilot:
        voices = voices[:2]

    log(f"🎤 Target voices: {', '.join(v['name'] for v in voices)}")
    log(f"📊 Total files to generate: {len(conversations)} × 2 × {len(voices)} = {len(conversations) * 2 * len(voices)}")

    if args.dry_run:
        log("\n🔍 DRY RUN MODE - showing what would be generated:")
        for conv in conversations[:3]:
            for voice in voices[:2]:
                log(f"   Would generate: {conv['id']} × {voice['name']} (prompt + response)")
        log(f"   ... and {len(conversations) * len(voices) - 6} more pairs")
        return

    # Initialize clients
    client, supabase = init_clients()

    # Check existing files
    log("\n📂 Checking existing files...")
    existing_by_voice = {}
    for voice in voices:
        existing = check_existing_files(supabase, voice['name'])
        existing_by_voice[voice['name']] = existing
        log(f"   {voice['name']}: {len(existing)} existing files")

    # Load progress
    completed = set()
    if args.resume:
        completed = load_progress()
        if completed:
            log(f"\n📂 Resumed: {len(completed)} items from progress file")

    # Calculate work
    to_generate = []
    for conv in conversations:
        for voice in voices:
            conv_id = conv['id']
            voice_name = voice['name']
            prompt_key = f"{conv_id}_prompt"
            response_key = f"{conv_id}_response"

            # Check if both files exist
            if prompt_key not in existing_by_voice.get(voice_name, set()) or \
               response_key not in existing_by_voice.get(voice_name, set()):
                if (conv_id, voice_name) not in completed:
                    to_generate.append((conv, voice))

    log(f"\n📊 Pairs to generate: {len(to_generate)}")
    log(f"📊 Already complete: {len(conversations) * len(voices) - len(to_generate)}")

    if not to_generate:
        log("\n✅ All files already generated!")
        return

    # Estimate credits (avg 10 words per text × 2 texts × $0.003/word)
    estimated_credits = len(to_generate) * 2 * 10 * 0.003
    log(f"💰 Estimated credits: ~{estimated_credits:.0f}")

    # Process
    results = []
    failed = 0

    for idx, (conv, voice) in enumerate(to_generate):
        conv_id = conv['id']
        voice_name = voice['name']
        category = conv['category']

        log(f"\n{'─' * 50}")
        log(f"💬 [{idx + 1}/{len(to_generate)}] {conv_id} ({category})")
        log(f"   🎤 {voice_name}: ", end="")

        success = False
        for attempt in range(MAX_RETRIES + 1):
            success, result = process_conversation(client, supabase, conv, voice)
            if success:
                results.extend(result)
                completed.add((conv_id, voice_name))
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

    log("\n📋 Next steps:")
    log("   1. Run ingestion script: python3 scripts/ingest_conversations.py")
    log("   2. Verify in app: test conversation exercises")


if __name__ == "__main__":
    main()
