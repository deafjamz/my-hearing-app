#!/usr/bin/env python3
"""
STORY AUDIO GENERATION V3
=========================
Generates audio with word-level alignment for 50 stories across 9 voices.

Target: 50 stories × 9 voices = 450 audio files
Estimated credits: ~2,000 (assuming 150 words avg @ $0.003/word)

Features:
- Word-level timestamps for karaoke/highlight functionality
- Loudness normalization to -20 LUFS
- Progress tracking with resume capability
- Parallel-friendly with storage conflict avoidance
- Pilot mode for testing (5 stories × 2 voices)

Usage:
    # Pilot mode (5 stories × 2 voices = 10 files)
    python3 scripts/generate_stories_v2.py --pilot

    # Full production (50 stories × 9 voices = 450 files)
    python3 scripts/generate_stories_v2.py

    # Specific voices only
    python3 scripts/generate_stories_v2.py --voices sarah,emma

    # Specific categories only
    python3 scripts/generate_stories_v2.py --category daily_life

    # Resume from progress file
    python3 scripts/generate_stories_v2.py --resume

Created: 2026-01-21
"""

import os
import sys
import json
import uuid
import time
import argparse
import subprocess
import requests
import base64
import pandas as pd
from datetime import datetime
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
STORIES_CSV = "content/source_csvs/stories_v3.csv"
PROGRESS_FILE = "story_v3_generation_progress.json"
LOG_FILE = "story_v3_generation.log"

# Audio settings
TARGET_LUFS = -20.0
MAX_RETRIES = 2

# =============================================================================
# INITIALIZATION
# =============================================================================

def init_supabase():
    """Initialize Supabase client."""
    if not all([ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
        print("❌ Error: Missing credentials in .env file.")
        print("   Required: ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase client initialized")
    return supabase

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

def generate_story_audio_with_alignment(text, voice_id):
    """
    Generate story audio with word-level timestamps using ElevenLabs.
    Uses the with-timestamps endpoint for karaoke/highlight functionality.
    """
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"
    headers = {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0
        }
    }

    try:
        response = requests.post(url, json=data, headers=headers, timeout=120)
        if response.status_code != 200:
            log(f"      ❌ API error: {response.status_code} - {response.text[:200]}")
            return None, None

        json_response = response.json()
        audio_base64 = json_response.get("audio_base64")
        alignment = json_response.get("alignment")

        if not audio_base64 or not alignment:
            log("      ❌ Missing audio or alignment data")
            return None, None

        audio_bytes = base64.b64decode(audio_base64)
        return audio_bytes, alignment

    except requests.exceptions.Timeout:
        log("      ❌ API timeout")
        return None, None
    except Exception as e:
        log(f"      ❌ Generation error: {e}")
        return None, None


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


def upload_to_supabase(supabase, local_path, bucket, storage_path, content_type="audio/mpeg"):
    """Upload file to Supabase storage."""
    try:
        with open(local_path, 'rb') as f:
            file_data = f.read()

        supabase.storage.from_(bucket).upload(
            storage_path,
            file_data,
            {"content-type": content_type, "upsert": "true"}
        )
        return supabase.storage.from_(bucket).get_public_url(storage_path)
    except Exception as e:
        log(f"      ❌ Upload error: {e}")
        return None


# =============================================================================
# PROCESSING
# =============================================================================

def check_existing_files(supabase, voice_name):
    """Check which story files already exist for a voice."""
    try:
        files = supabase.storage.from_("audio").list(
            f"stories/{voice_name}",
            {"limit": 500}
        )
        existing = set()
        for f in files:
            if f['name'].endswith('.mp3'):
                story_id = f['name'].replace('.mp3', '')
                existing.add(story_id)
        return existing
    except Exception as e:
        log(f"   ⚠️ Could not check existing files for {voice_name}: {e}")
        return set()


def process_story(supabase, story, voice):
    """Process a single story for one voice."""
    voice_name = voice['name']
    voice_id = voice['id']
    story_id = story['id']
    transcript = story['transcript']

    # Generate audio with alignment
    audio_bytes, alignment = generate_story_audio_with_alignment(transcript, voice_id)
    if not audio_bytes:
        return False, None

    # Save raw audio
    raw_file = f"temp_story_raw_{uuid.uuid4()}.mp3"
    with open(raw_file, 'wb') as f:
        f.write(audio_bytes)

    # Normalize
    final_file = f"temp_story_final_{uuid.uuid4()}.mp3"
    if not normalize_audio(raw_file, final_file):
        os.remove(raw_file)
        return False, None

    duration = get_audio_duration(final_file)

    # Save alignment
    align_file = f"temp_story_align_{uuid.uuid4()}.json"
    with open(align_file, 'w') as f:
        json.dump(alignment, f)

    # Upload audio
    audio_path = f"stories/{voice_name}/{story_id}.mp3"
    audio_url = upload_to_supabase(supabase, final_file, "audio", audio_path, "audio/mpeg")

    # Upload alignment
    align_path = f"stories/{voice_name}/{story_id}.json"
    align_url = upload_to_supabase(supabase, align_file, "alignment", align_path, "application/json")

    # Cleanup temp files
    for f in [raw_file, final_file, align_file]:
        if os.path.exists(f):
            os.remove(f)

    if not audio_url or not align_url:
        return False, None

    return True, {
        'story_id': story_id,
        'voice': voice_name,
        'duration': duration,
        'audio_url': audio_url,
        'align_url': align_url,
        'word_count': story.get('word_count', 0),
        'category': story.get('category', '')
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
    parser = argparse.ArgumentParser(description="Generate story audio for all voices (v2 content)")
    parser.add_argument("--pilot", action="store_true", help="Pilot mode (5 stories × 2 voices)")
    parser.add_argument("--voices", type=str, help="Comma-separated list of voices")
    parser.add_argument("--category", type=str, help="Filter by category")
    parser.add_argument("--resume", action="store_true", help="Resume from progress file")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated")
    args = parser.parse_args()

    log("\n" + "=" * 70)
    log("📖 STORY AUDIO GENERATION V3")
    log("=" * 70)

    # Check ffmpeg
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        log("✅ ffmpeg available")
    except FileNotFoundError:
        log("❌ ffmpeg not found. Install via: brew install ffmpeg")
        sys.exit(1)

    # Load stories from CSV
    if not os.path.exists(STORIES_CSV):
        log(f"❌ Error: Stories CSV not found: {STORIES_CSV}")
        log("   Run: python3 scripts/ingest_stories_v2.py first")
        sys.exit(1)

    stories_df = pd.read_csv(STORIES_CSV)
    stories = stories_df.to_dict('records')

    # Filter by category if specified
    if args.category:
        stories = [s for s in stories if s['category'] == args.category]
        log(f"📂 Filtered to category: {args.category} ({len(stories)} stories)")

    log(f"\n📚 Found {len(stories)} stories in CSV")

    # Pilot mode: first 5 stories
    if args.pilot:
        stories = stories[:5]
        log(f"\n🧪 PILOT MODE: Processing first 5 stories")

    # Determine which voices to process
    if args.voices:
        voice_names = [v.strip().lower() for v in args.voices.split(',')]
        voices = [v for v in ALL_VOICES if v['name'] in voice_names]
    else:
        voices = ALL_VOICES

    # Pilot mode: first 2 voices
    if args.pilot:
        voices = voices[:2]

    log(f"🎤 Target voices: {', '.join(v['name'] for v in voices)}")
    log(f"📊 Total combinations: {len(stories)} × {len(voices)} = {len(stories) * len(voices)} files")

    if args.dry_run:
        log("\n🔍 DRY RUN MODE - showing what would be generated:")
        for story in stories[:3]:
            for voice in voices[:2]:
                log(f"   Would generate: {story['id']} × {voice['name']}")
        log(f"   ... and {len(stories) * len(voices) - 6} more")
        return

    # Initialize Supabase
    supabase = init_supabase()

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

    # Calculate what needs to be done
    to_generate = []
    for story in stories:
        for voice in voices:
            story_id = story['id']
            voice_name = voice['name']
            if story_id not in existing_by_voice.get(voice_name, set()):
                if (story_id, voice_name) not in completed:
                    to_generate.append((story, voice))

    log(f"\n📊 Files to generate: {len(to_generate)}")
    log(f"📊 Already complete: {len(stories) * len(voices) - len(to_generate)}")

    if not to_generate:
        log("\n✅ All files already generated!")
        return

    # Estimate credits
    total_words = sum(s.get('word_count', 100) for s, _ in to_generate)
    estimated_credits = total_words * 0.003
    log(f"💰 Estimated credits: ~{estimated_credits:.0f} ({total_words} words @ $0.003/word)")

    # Process
    results = []
    failed = 0

    for idx, (story, voice) in enumerate(to_generate):
        story_id = story['id']
        voice_name = voice['name']
        title = story['title']

        log(f"\n{'─' * 50}")
        log(f"📖 [{idx + 1}/{len(to_generate)}] {title}")
        log(f"   🎤 {voice_name}...", end=" ")

        # Try with retries
        success = False
        for attempt in range(MAX_RETRIES + 1):
            success, result = process_story(supabase, story, voice)
            if success:
                log(f"✅ {result['duration']:.1f}s")
                results.append(result)
                completed.add((story_id, voice_name))
                save_progress(completed)
                break
            elif attempt < MAX_RETRIES:
                log(f"Retry {attempt + 1}...", end=" ")
                time.sleep(2)

        if not success:
            log("❌ Failed after retries")
            failed += 1

        # Rate limiting
        time.sleep(0.5)

    # Summary
    log("\n" + "=" * 70)
    log("🎯 GENERATION COMPLETE")
    log("=" * 70)
    log(f"   Total attempted: {len(to_generate)}")
    log(f"   Successful: {len(results)}")
    log(f"   Failed: {failed}")

    if results:
        total_duration = sum(r['duration'] for r in results)
        log(f"\n📊 Results:")
        log(f"   Total audio duration: {total_duration / 60:.1f} minutes")

        log(f"\n📊 By voice:")
        for voice in voices:
            count = sum(1 for r in results if r['voice'] == voice['name'])
            log(f"   {voice['name']}: {count} files")

        log(f"\n📊 By category:")
        categories = set(r['category'] for r in results)
        for cat in categories:
            count = sum(1 for r in results if r['category'] == cat)
            log(f"   {cat}: {count} files")

    log("\n📋 Next steps:")
    log("   1. Verify audio quality: spot-check a few files")
    log("   2. Test in app: select stories and verify playback")
    log("   3. Run schema migration if needed for new voice columns")


if __name__ == "__main__":
    main()
