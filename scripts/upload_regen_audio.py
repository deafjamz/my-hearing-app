#!/usr/bin/env python3
"""
Upload Regenerated Audio to Supabase Storage

Uploads locally-generated clean audio files to Supabase Storage.
Requires SUPABASE_SERVICE_ROLE_KEY (JWT format) — get from:
  Supabase Dashboard > Settings > API > service_role key

Usage:
  # Dry run — show what would be uploaded
  python3 scripts/upload_regen_audio.py --input-dir regen_output

  # Upload all files
  python3 scripts/upload_regen_audio.py --input-dir regen_output --execute

  # Upload specific voice only
  python3 scripts/upload_regen_audio.py --input-dir regen_output --voice daniel --execute
"""

import os
import sys
import argparse
import time
import requests
from pathlib import Path


def _load_env_key(key: str, env_path: str = ".env") -> str | None:
    """Read a single key from a .env file without python-dotenv."""
    if not os.path.exists(env_path):
        return None
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith(f"{key}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


SUPABASE_URL = (
    _load_env_key("SUPABASE_URL")
    or _load_env_key("VITE_SUPABASE_URL")
    or _load_env_key("SUPABASE_URL", ".env.local")
    or _load_env_key("VITE_SUPABASE_URL", ".env.local")
    or "https://padfntxzoxhozfjsqnzc.supabase.co"
).strip()

SUPABASE_SERVICE_ROLE_KEY = (
    _load_env_key("SUPABASE_SERVICE_ROLE_KEY")
    or _load_env_key("SUPABASE_SERVICE_ROLE_KEY", ".env.local")
)

STORAGE_BUCKET = "audio"
STORAGE_PREFIX = "words_v2"


def upload_file(filepath: str, voice: str, word: str) -> bool:
    """Upload a single MP3 file to Supabase Storage."""
    dest_path = f"{STORAGE_PREFIX}/{voice}/{word}.mp3"
    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{dest_path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "audio/mpeg",
        "x-upsert": "true",
    }
    with open(filepath, "rb") as f:
        response = requests.post(url, headers=headers, data=f.read(), timeout=30)

    if response.status_code in (200, 201):
        return True
    else:
        print(f"    FAILED ({response.status_code}): {response.text[:200]}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Upload regenerated audio to Supabase Storage")
    parser.add_argument("--input-dir", required=True, help="Directory with regenerated files (voice/word.mp3)")
    parser.add_argument("--voice", default=None, help="Upload only this voice")
    parser.add_argument("--execute", action="store_true", help="Actually upload (default is dry run)")
    args = parser.parse_args()

    if not os.path.isdir(args.input_dir):
        print(f"  ERROR: Directory not found: {args.input_dir}")
        sys.exit(1)

    if args.execute and not SUPABASE_SERVICE_ROLE_KEY:
        print("  ERROR: SUPABASE_SERVICE_ROLE_KEY not set in .env or .env.local")
        print("  Get it from: Supabase Dashboard > Settings > API > service_role key (JWT)")
        sys.exit(1)

    # Discover files
    files = []
    for voice_dir in sorted(Path(args.input_dir).iterdir()):
        if not voice_dir.is_dir():
            continue
        voice = voice_dir.name
        if args.voice and voice != args.voice:
            continue
        for mp3 in sorted(voice_dir.glob("*.mp3")):
            word = mp3.stem
            files.append((str(mp3), voice, word))

    print(f"\n  Found {len(files)} files to upload")
    if args.voice:
        print(f"  Voice filter: {args.voice}")

    if not args.execute:
        for filepath, voice, word in files[:10]:
            print(f"    Would upload: {voice}/{word}.mp3")
        if len(files) > 10:
            print(f"    ... and {len(files) - 10} more")
        print(f"\n  To upload: add --execute flag")
        return

    # Upload
    success = 0
    failed = 0
    for i, (filepath, voice, word) in enumerate(files):
        pct = (i + 1) / len(files) * 100
        print(f"  [{i+1}/{len(files)} {pct:.0f}%] {voice}/{word} ... ", end="", flush=True)
        if upload_file(filepath, voice, word):
            print("OK")
            success += 1
        else:
            failed += 1
        time.sleep(0.1)  # Light rate limiting

    print(f"\n  Done: {success} uploaded, {failed} failed")


if __name__ == "__main__":
    main()
