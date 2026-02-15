#!/usr/bin/env python3
"""
SPEED VARIANT GENERATION (via ffmpeg — ZERO ElevenLabs credits)
===============================================================
Downloads existing audio from Supabase Storage, applies pitch-preserving
speed changes via ffmpeg atempo filter, normalizes to -20 LUFS, and
uploads the results back to Supabase Storage.

Target:
  Sentences v1: 628 × 9 voices × 2 rates = 11,304 files
  Stories:       60 × 9 voices × 2 rates  =  1,080 files
  Total:                                    12,384 files (all FREE)

Usage:
    # Pilot mode (5 items × 2 voices × 2 rates = 20 files)
    python3 scripts/generate_speed_variants.py --pilot

    # Sentences only
    python3 scripts/generate_speed_variants.py --source sentences

    # Stories only
    python3 scripts/generate_speed_variants.py --source stories

    # Specific voices
    python3 scripts/generate_speed_variants.py --voices sarah,emma

    # Specific rate only
    python3 scripts/generate_speed_variants.py --rate 1.2

    # Full production (all sentences + stories × 9 voices × 2 rates)
    python3 scripts/generate_speed_variants.py

    # Resume from progress file
    python3 scripts/generate_speed_variants.py --resume

Created: 2026-02-14
"""

import os
import sys
import json
import uuid
import time
import argparse
import subprocess
import tempfile
import requests
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


# Credentials (no ElevenLabs needed!)
SUPABASE_URL = get_key_from_env_file("SUPABASE_URL")
SUPABASE_KEY = get_key_from_env_file("SUPABASE_SERVICE_ROLE_KEY")

# 9-Voice Roster
ALL_VOICES = [
    {"name": "sarah",   "region": "US", "gender": "female"},
    {"name": "emma",    "region": "US", "gender": "female"},
    {"name": "bill",    "region": "US", "gender": "male"},
    {"name": "michael", "region": "US", "gender": "male"},
    {"name": "alice",   "region": "UK", "gender": "female"},
    {"name": "daniel",  "region": "UK", "gender": "male"},
    {"name": "matilda", "region": "AU", "gender": "female"},
    {"name": "charlie", "region": "AU", "gender": "male"},
    {"name": "aravind", "region": "IN", "gender": "male"},
]

# Speed multipliers (pitch-preserving via atempo)
SPEED_RATES = {
    '1.2': 1.2,   # Moderate challenge
    '1.5': 1.5,   # Advanced challenge
}

# Source audio configurations
SOURCES = {
    'sentences': {
        'storage_prefix': 'sentences_v1',
        'output_prefix': 'sentences_speed',
        'file_pattern': 'sentence_{n}.mp3',  # sentence_1.mp3 through sentence_628.mp3
        'count': 628,
    },
    'stories': {
        'storage_prefix': 'stories',
        'output_prefix': 'stories_speed',
        'file_pattern': 'story_v3_{cat}_{n:03d}.mp3',
        'count': 60,
    },
}

# Audio settings
TARGET_LUFS = -20.0
PROGRESS_FILE = "speed_variants_progress.json"
LOG_FILE = "speed_variants_generation.log"

# =============================================================================
# INITIALIZATION
# =============================================================================

def init_supabase():
    """Initialize Supabase client."""
    if not all([SUPABASE_URL, SUPABASE_KEY]):
        print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
        sys.exit(1)
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Supabase client initialized")
    return supabase


def log(message, end="\n"):
    """Write to both console and log file."""
    print(message, end=end, flush=True)
    with open(LOG_FILE, 'a') as f:
        f.write(f"{datetime.now().isoformat()} | {message}\n")

# =============================================================================
# PROGRESS TRACKING
# =============================================================================

def load_progress():
    """Load progress from checkpoint file."""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {"completed": [], "failed": [], "stats": {"total": 0, "success": 0, "fail": 0}}


def save_progress(progress):
    """Save progress to checkpoint file."""
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

# =============================================================================
# AUDIO PROCESSING (ffmpeg only — no ElevenLabs)
# =============================================================================

def download_from_supabase(supabase, storage_path):
    """Download a file from Supabase Storage. Returns bytes or None."""
    try:
        url = f"{SUPABASE_URL}/storage/v1/object/public/audio/{storage_path}"
        response = requests.get(url, timeout=30)
        if response.status_code == 200 and len(response.content) > 100:
            return response.content
        return None
    except Exception as e:
        log(f"      Download error: {e}")
        return None


def apply_speed_change(input_path, output_path, speed_multiplier):
    """Apply pitch-preserving speed change using ffmpeg atempo filter."""
    try:
        # atempo range is 0.5-100.0 (newer ffmpeg versions)
        # For safety, clamp to 0.5-2.0 range
        speed = max(0.5, min(2.0, speed_multiplier))

        cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", input_path,
            "-filter:a", f"atempo={speed}",
            "-vn",
            output_path
        ]
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return os.path.exists(output_path)
    except Exception as e:
        log(f"      Speed change error: {e}")
        return False


def normalize_audio(input_path, output_path):
    """Normalize audio to target LUFS using ffmpeg loudnorm."""
    try:
        cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", input_path,
            "-af", f"loudnorm=I={TARGET_LUFS}:TP=-1.5:LRA=11",
            "-ar", "44100",
            "-b:a", "128k",
            output_path
        ]
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        return os.path.exists(output_path)
    except Exception as e:
        log(f"      Normalization error: {e}")
        return False


def get_audio_duration(audio_path):
    """Get audio duration in seconds using ffprobe."""
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


def upload_to_supabase(supabase, local_path, storage_path):
    """Upload file to Supabase Storage."""
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
        error_str = str(e)
        if "Duplicate" in error_str or "already exists" in error_str:
            # File already exists — update instead
            try:
                supabase.storage.from_("audio").update(
                    storage_path,
                    file_data,
                    {"content-type": "audio/mpeg"}
                )
                return True
            except:
                pass
        log(f"      Upload error: {e}")
        return False

# =============================================================================
# FILE LISTING
# =============================================================================

def list_source_files(supabase, voice_name, source_type):
    """List available source audio files for a voice."""
    config = SOURCES[source_type]
    prefix = f"{config['storage_prefix']}/{voice_name}"

    try:
        files = supabase.storage.from_("audio").list(prefix, {"limit": 1000})
        mp3_files = [f['name'] for f in files if f['name'].endswith('.mp3')]
        return sorted(mp3_files)
    except Exception as e:
        log(f"   Error listing files for {voice_name}/{source_type}: {e}")
        return []


def list_existing_speed_files(supabase, voice_name, source_type, rate_key):
    """Check which speed variant files already exist."""
    config = SOURCES[source_type]
    output_dir = f"{config['output_prefix']}/{voice_name}/{rate_key}x"

    try:
        files = supabase.storage.from_("audio").list(output_dir, {"limit": 2000})
        return set(f['name'] for f in files if f['name'].endswith('.mp3'))
    except:
        return set()

# =============================================================================
# MAIN PROCESSING
# =============================================================================

def process_file(supabase, voice_name, source_type, filename, rate_key):
    """Download, speed-change, normalize, and upload a single file."""
    config = SOURCES[source_type]
    rate_multiplier = SPEED_RATES[rate_key]

    source_path = f"{config['storage_prefix']}/{voice_name}/{filename}"
    output_storage = f"{config['output_prefix']}/{voice_name}/{rate_key}x/{filename}"

    with tempfile.TemporaryDirectory() as tmpdir:
        raw_path = os.path.join(tmpdir, "raw.mp3")
        speed_path = os.path.join(tmpdir, "speed.mp3")
        final_path = os.path.join(tmpdir, "final.mp3")

        # Step 1: Download source audio
        audio_bytes = download_from_supabase(supabase, source_path)
        if not audio_bytes:
            return False, "download_failed"

        with open(raw_path, 'wb') as f:
            f.write(audio_bytes)

        # Step 2: Apply speed change
        if not apply_speed_change(raw_path, speed_path, rate_multiplier):
            return False, "speed_failed"

        # Step 3: Normalize to -20 LUFS
        if not normalize_audio(speed_path, final_path):
            return False, "normalize_failed"

        # Step 4: Verify duration
        duration = get_audio_duration(final_path)
        if duration < 0.3:
            return False, f"too_short_{duration:.1f}s"

        # Step 5: Upload
        if not upload_to_supabase(supabase, final_path, output_storage):
            return False, "upload_failed"

    return True, None


def run(args):
    """Main execution."""
    supabase = init_supabase()
    progress = load_progress() if args.resume else {
        "completed": [], "failed": [], "stats": {"total": 0, "success": 0, "fail": 0}
    }
    completed_set = set(progress["completed"])

    # Determine which sources to process
    source_types = [args.source] if args.source else ['sentences', 'stories']

    # Determine which voices to process
    if args.voices:
        voice_names = [v.strip() for v in args.voices.split(',')]
        voices = [v for v in ALL_VOICES if v['name'] in voice_names]
    else:
        voices = ALL_VOICES

    # Determine which rates to process
    if args.rate:
        rates = [args.rate]
    else:
        rates = list(SPEED_RATES.keys())

    log(f"\n{'='*60}")
    log(f"SPEED VARIANT GENERATION")
    log(f"Sources: {source_types}")
    log(f"Voices: {[v['name'] for v in voices]}")
    log(f"Rates: {[r + 'x' for r in rates]}")
    log(f"Resume: {args.resume}")
    log(f"Pilot: {args.pilot}")
    log(f"{'='*60}\n")

    total_processed = 0
    total_success = 0
    total_failed = 0

    for source_type in source_types:
        log(f"\n--- Source: {source_type} ---")

        for voice in voices:
            voice_name = voice['name']
            log(f"\n  Voice: {voice_name} ({voice['region']})")

            # List available source files
            source_files = list_source_files(supabase, voice_name, source_type)
            if not source_files:
                log(f"    No source files found. Skipping.")
                continue

            log(f"    Found {len(source_files)} source files")

            if args.pilot:
                source_files = source_files[:5]
                log(f"    Pilot mode: processing first 5 files")

            for rate_key in rates:
                rate_label = f"{rate_key}x"
                log(f"\n    Rate: {rate_label}")

                # Check existing
                existing = list_existing_speed_files(supabase, voice_name, source_type, rate_key)
                log(f"      {len(existing)} already exist")

                batch_success = 0
                batch_fail = 0

                for i, filename in enumerate(source_files):
                    # Build unique key for progress tracking
                    task_key = f"{source_type}/{voice_name}/{rate_key}/{filename}"

                    # Skip if already completed
                    if task_key in completed_set:
                        continue

                    # Skip if file already exists in storage
                    if filename in existing:
                        completed_set.add(task_key)
                        progress["completed"].append(task_key)
                        continue

                    # Process
                    success, error = process_file(supabase, voice_name, source_type, filename, rate_key)

                    total_processed += 1
                    if success:
                        total_success += 1
                        batch_success += 1
                        completed_set.add(task_key)
                        progress["completed"].append(task_key)
                    else:
                        total_failed += 1
                        batch_fail += 1
                        progress["failed"].append({"key": task_key, "error": error})

                    # Progress indicator every 10 files
                    if total_processed % 10 == 0:
                        log(f"      [{i+1}/{len(source_files)}] {total_success} ok, {total_failed} fail", end="\r")

                    # Save progress every 50 files
                    if total_processed % 50 == 0:
                        progress["stats"] = {"total": total_processed, "success": total_success, "fail": total_failed}
                        save_progress(progress)

                    # Rate limit: avoid overwhelming Supabase
                    time.sleep(0.1)

                log(f"      Batch complete: {batch_success} ok, {batch_fail} fail")

    # Final save
    progress["stats"] = {"total": total_processed, "success": total_success, "fail": total_failed}
    save_progress(progress)

    log(f"\n{'='*60}")
    log(f"COMPLETE")
    log(f"Total processed: {total_processed}")
    log(f"Success: {total_success}")
    log(f"Failed: {total_failed}")
    log(f"Progress saved to: {PROGRESS_FILE}")
    log(f"{'='*60}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate speed variants via ffmpeg")
    parser.add_argument("--source", choices=['sentences', 'stories'], help="Process only this source type")
    parser.add_argument("--voices", help="Comma-separated voice names (default: all 9)")
    parser.add_argument("--rate", choices=['1.2', '1.5'], help="Process only this rate (default: both)")
    parser.add_argument("--pilot", action="store_true", help="Pilot mode: 5 files × 2 voices")
    parser.add_argument("--resume", action="store_true", help="Resume from progress file")
    args = parser.parse_args()

    if args.pilot and not args.voices:
        args.voices = "sarah,emma"

    run(args)
