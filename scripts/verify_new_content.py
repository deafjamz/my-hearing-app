#!/usr/bin/env python3
"""
CONTENT QUALITY VERIFICATION
=============================
Verifies all audio files in Supabase Storage for existence, duration,
and loudness compliance. Generates a report of failures for regeneration.

Checks:
  1. File exists in Supabase Storage
  2. Duration > minimum threshold (0.8s for sentences, 10s for stories)
  3. Loudness within -22 to -18 LUFS (target: -20)
  4. No clipping (peak < -1 dB)

Usage:
    # Verify all content types
    python3 scripts/verify_new_content.py

    # Verify specific content type
    python3 scripts/verify_new_content.py --type sentences_v2

    # Verify specific voice
    python3 scripts/verify_new_content.py --voice sarah

    # Verify speed variants only
    python3 scripts/verify_new_content.py --type speed_variants

    # Quick spot-check (random 10 per voice)
    python3 scripts/verify_new_content.py --spot-check

Created: 2026-02-14
"""

import os
import sys
import json
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


SUPABASE_URL = get_key_from_env_file("SUPABASE_URL")
SUPABASE_KEY = get_key_from_env_file("SUPABASE_SERVICE_ROLE_KEY")

ALL_VOICES = ["sarah", "emma", "bill", "michael", "alice", "daniel", "matilda", "charlie", "aravind"]

# Content type configurations
CONTENT_TYPES = {
    'words': {
        'storage_prefix': 'words_v2',
        'min_duration': 0.3,
        'expected_per_voice': 1847,
    },
    'sentences_v1': {
        'storage_prefix': 'sentences_v1',
        'min_duration': 0.8,
        'expected_per_voice': 628,
    },
    'sentences_v2': {
        'storage_prefix': 'sentences_v2',
        'min_duration': 0.8,
        'expected_per_voice': 630,
    },
    'stories': {
        'storage_prefix': 'stories',
        'min_duration': 10.0,
        'expected_per_voice': 60,
    },
    'conversations': {
        'storage_prefix': 'conversations',
        'min_duration': 0.5,
        'expected_per_voice': 160,
    },
    'drills': {
        'storage_prefix': 'drills',
        'min_duration': 0.3,
        'expected_per_voice': 400,
    },
    'rate_variants': {
        'storage_prefix': 'rate_variants',
        'min_duration': 0.3,
        'expected_per_voice': 200,
    },
    'speed_variants_sentences': {
        'storage_prefix': 'sentences_speed',
        'min_duration': 0.5,
        'expected_per_voice': 1256,  # 628 × 2 rates
    },
    'speed_variants_stories': {
        'storage_prefix': 'stories_speed',
        'min_duration': 7.0,  # Faster = shorter
        'expected_per_voice': 120,  # 60 × 2 rates
    },
}

TARGET_LUFS = -20.0
LUFS_TOLERANCE = 2.0  # Accept -22 to -18

REPORT_FILE = "verification_report.json"
LOG_FILE = "verification.log"

# =============================================================================
# INITIALIZATION
# =============================================================================

def init_supabase():
    """Initialize Supabase client."""
    if not all([SUPABASE_URL, SUPABASE_KEY]):
        print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def log(message):
    """Write to both console and log file."""
    print(message, flush=True)
    with open(LOG_FILE, 'a') as f:
        f.write(f"{datetime.now().isoformat()} | {message}\n")

# =============================================================================
# AUDIO ANALYSIS
# =============================================================================

def get_audio_info(audio_path):
    """Get duration, loudness, and peak level using ffmpeg."""
    info = {"duration": 0.0, "lufs": None, "peak_db": None}

    # Duration
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            audio_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        info["duration"] = float(result.stdout.strip())
    except:
        pass

    # Loudness (LUFS) and peak
    try:
        cmd = [
            "ffmpeg", "-i", audio_path,
            "-af", "loudnorm=print_format=json",
            "-f", "null", "-"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        # Parse JSON from stderr
        stderr = result.stderr
        json_start = stderr.rfind('{')
        json_end = stderr.rfind('}') + 1
        if json_start >= 0 and json_end > json_start:
            loudness_data = json.loads(stderr[json_start:json_end])
            info["lufs"] = float(loudness_data.get("input_i", 0))
            info["peak_db"] = float(loudness_data.get("input_tp", 0))
    except:
        pass

    return info


def download_and_check(supabase, storage_path, min_duration):
    """Download file and perform quality checks."""
    url = f"{SUPABASE_URL}/storage/v1/object/public/audio/{storage_path}"

    try:
        response = requests.get(url, timeout=30)
        if response.status_code != 200:
            return {"exists": False, "error": f"HTTP {response.status_code}"}

        if len(response.content) < 100:
            return {"exists": False, "error": "file_too_small"}

        # Write to temp file for analysis
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
            tmp.write(response.content)
            tmp_path = tmp.name

        try:
            info = get_audio_info(tmp_path)

            result = {
                "exists": True,
                "size_bytes": len(response.content),
                "duration": info["duration"],
                "lufs": info["lufs"],
                "peak_db": info["peak_db"],
                "issues": [],
            }

            # Check duration
            if info["duration"] < min_duration:
                result["issues"].append(f"too_short:{info['duration']:.1f}s<{min_duration}s")

            # Check loudness
            if info["lufs"] is not None:
                if abs(info["lufs"] - TARGET_LUFS) > LUFS_TOLERANCE:
                    result["issues"].append(f"loudness:{info['lufs']:.1f}LUFS")

            # Check clipping
            if info["peak_db"] is not None and info["peak_db"] > -1.0:
                result["issues"].append(f"clipping:{info['peak_db']:.1f}dB")

            return result
        finally:
            os.unlink(tmp_path)

    except Exception as e:
        return {"exists": False, "error": str(e)}

# =============================================================================
# VERIFICATION
# =============================================================================

def list_files(supabase, prefix):
    """List all MP3 files under a storage prefix."""
    try:
        files = supabase.storage.from_("audio").list(prefix, {"limit": 2000})
        return [f['name'] for f in files if f['name'].endswith('.mp3')]
    except:
        return []


def verify_content_type(supabase, content_type, voices, spot_check=False):
    """Verify all files for a content type across voices."""
    config = CONTENT_TYPES[content_type]
    results = {
        "content_type": content_type,
        "voices": {},
        "summary": {"total_files": 0, "missing": 0, "issues": 0, "ok": 0},
    }

    for voice in voices:
        prefix = f"{config['storage_prefix']}/{voice}"
        files = list_files(supabase, prefix)

        voice_result = {
            "file_count": len(files),
            "expected": config['expected_per_voice'],
            "coverage": f"{len(files)}/{config['expected_per_voice']}",
            "issues": [],
            "spot_checked": 0,
        }

        results["summary"]["total_files"] += len(files)

        if len(files) < config['expected_per_voice']:
            gap = config['expected_per_voice'] - len(files)
            results["summary"]["missing"] += gap
            voice_result["issues"].append(f"missing_{gap}_files")

        # Spot check: analyze a sample of files
        import random
        check_files = files
        if spot_check and len(files) > 10:
            check_files = random.sample(files, 10)

        for filename in check_files:
            storage_path = f"{prefix}/{filename}"
            check = download_and_check(supabase, storage_path, config['min_duration'])

            voice_result["spot_checked"] += 1

            if not check.get("exists"):
                results["summary"]["issues"] += 1
                voice_result["issues"].append(f"{filename}: {check.get('error', 'unknown')}")
            elif check.get("issues"):
                results["summary"]["issues"] += 1
                for issue in check["issues"]:
                    voice_result["issues"].append(f"{filename}: {issue}")
            else:
                results["summary"]["ok"] += 1

        results["voices"][voice] = voice_result
        log(f"    {voice}: {len(files)} files, {len(voice_result['issues'])} issues")

    return results


def run(args):
    """Main verification."""
    supabase = init_supabase()

    # Determine what to verify
    if args.type:
        types_to_check = [args.type]
    else:
        types_to_check = list(CONTENT_TYPES.keys())

    # Determine voices
    if args.voice:
        voices = [args.voice]
    else:
        voices = ALL_VOICES

    log(f"\n{'='*60}")
    log(f"CONTENT QUALITY VERIFICATION")
    log(f"Types: {types_to_check}")
    log(f"Voices: {voices}")
    log(f"Spot check: {args.spot_check}")
    log(f"{'='*60}\n")

    full_report = {
        "timestamp": datetime.now().isoformat(),
        "results": {},
        "grand_total": {"files": 0, "missing": 0, "issues": 0, "ok": 0},
    }

    for content_type in types_to_check:
        if content_type not in CONTENT_TYPES:
            log(f"  Unknown content type: {content_type}. Skipping.")
            continue

        log(f"\n  Verifying: {content_type}")
        result = verify_content_type(supabase, content_type, voices, args.spot_check)
        full_report["results"][content_type] = result

        full_report["grand_total"]["files"] += result["summary"]["total_files"]
        full_report["grand_total"]["missing"] += result["summary"]["missing"]
        full_report["grand_total"]["issues"] += result["summary"]["issues"]
        full_report["grand_total"]["ok"] += result["summary"]["ok"]

    # Save report
    with open(REPORT_FILE, 'w') as f:
        json.dump(full_report, f, indent=2)

    # Print summary
    gt = full_report["grand_total"]
    log(f"\n{'='*60}")
    log(f"VERIFICATION COMPLETE")
    log(f"Total files found: {gt['files']}")
    log(f"Missing files: {gt['missing']}")
    log(f"Quality issues: {gt['issues']}")
    log(f"OK (spot-checked): {gt['ok']}")
    log(f"Report saved to: {REPORT_FILE}")
    log(f"{'='*60}")

    # Print failures for easy regeneration
    fail_count = 0
    for ct, result in full_report["results"].items():
        for voice, vr in result["voices"].items():
            for issue in vr["issues"]:
                if fail_count < 20:
                    log(f"  ISSUE: {ct}/{voice} — {issue}")
                fail_count += 1

    if fail_count > 20:
        log(f"  ... and {fail_count - 20} more (see {REPORT_FILE})")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Verify audio content quality")
    parser.add_argument("--type", choices=list(CONTENT_TYPES.keys()), help="Verify specific content type")
    parser.add_argument("--voice", choices=ALL_VOICES, help="Verify specific voice")
    parser.add_argument("--spot-check", action="store_true", help="Random 10 files per voice instead of all")
    args = parser.parse_args()
    run(args)
