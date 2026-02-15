#!/usr/bin/env python3
"""
Download pilot batch files from Supabase storage for manual validation.
Downloads all 20 files (5 words × 4 voices) to local directory for listening.
"""

import os
from supabase import create_client, Client

def get_key_from_env_file(key_name, file_path=".env"):
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

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pilot batch configuration
WORDS = ["bat", "bead", "bid", "dead", "deed"]
VOICES = ["sarah", "marcus", "emma", "david"]

# QA results from V3 test
FAILED_FILES = [
    ("emma", "bat", "Excessive silence at end: 137ms"),
    ("marcus", "deed", "Excessive silence at start: 76ms")
]

# Create download directory
download_dir = "pilot_batch_validation"
os.makedirs(download_dir, exist_ok=True)

print("=" * 80)
print("📥 DOWNLOADING PILOT BATCH FOR VALIDATION")
print("=" * 80)
print()
print(f"Downloading 20 files to: {download_dir}/")
print()

downloaded = []
failed_downloads = []

for voice in VOICES:
    print(f"🎤 {voice.upper()}")
    voice_dir = os.path.join(download_dir, voice)
    os.makedirs(voice_dir, exist_ok=True)

    for word in WORDS:
        storage_path = f"words_v2/{voice}/{word}.mp3"
        local_path = os.path.join(voice_dir, f"{word}.mp3")

        try:
            # Download file
            response = supabase.storage.from_("audio").download(storage_path)

            with open(local_path, 'wb') as f:
                f.write(response)

            # Check if this file failed QA
            qa_status = "✅ PASSED"
            for failed_voice, failed_word, reason in FAILED_FILES:
                if voice == failed_voice and word == failed_word:
                    qa_status = f"⚠️  FLAGGED: {reason}"

            print(f"   {word:6} - {qa_status}")
            downloaded.append((voice, word, local_path))

        except Exception as e:
            print(f"   {word:6} - ❌ Download failed: {e}")
            failed_downloads.append((voice, word))

    print()

print("=" * 80)
print(f"✅ Downloaded: {len(downloaded)}/20 files")
if failed_downloads:
    print(f"❌ Failed: {len(failed_downloads)} files")
print("=" * 80)
print()

# Generate listening instructions
print("🎧 LISTENING INSTRUCTIONS")
print("=" * 80)
print()
print("Option 1: Listen to individual files")
print("-" * 80)
print("# Play a specific file:")
print(f"afplay {download_dir}/sarah/bat.mp3")
print()
print("Option 2: Listen to all files by voice")
print("-" * 80)
for voice in VOICES:
    print(f"# {voice.upper()} - all words:")
    print(f"for word in bat bead bid dead deed; do echo \"$word:\"; afplay {download_dir}/{voice}/$word.mp3; done")
print()
print("Option 3: Listen to flagged files only")
print("-" * 80)
print("# Files that failed QA checks:")
for failed_voice, failed_word, reason in FAILED_FILES:
    print(f"# {failed_voice.upper()} {failed_word} - {reason}")
    print(f"afplay {download_dir}/{failed_voice}/{failed_word}.mp3")
print()
print("=" * 80)
print()
print("VALIDATION CHECKLIST:")
print("-" * 80)
print("Listen for:")
print("  ✓ No carrier phrase bleed (\"is\" sound at start)")
print("  ✓ No shadow clip (dead silence at end)")
print("  ✓ Clean fades at beginning and end")
print("  ✓ Natural voice quality (not robotic)")
print("  ✓ Appropriate duration (not too short/clipped)")
print("  ✓ Consistent volume across all files")
print()
print("Pay special attention to:")
print("  • Emma \"bat\" - flagged for 137ms silence at end")
print("  • Marcus \"deed\" - flagged for 76ms silence at start")
print()
print("=" * 80)
