#!/usr/bin/env python3
"""
WORD PAIR AUDIO LINKAGE SCRIPT
==============================
Links existing word audio files from Supabase storage (words_v2/) to word_pairs table.

Storage: audio/words_v2/{voice}/{word}.mp3
Table columns: audio_1_path_{voice}, audio_2_path_{voice}

Voices with columns: sarah, marcus, emma, david
Storage has: sarah, emma, bill, michael, alice, daniel, matilda, charlie, aravind, marcus, david (11)

Created: 2026-01-22
"""

import os
import sys
from datetime import datetime
from supabase import create_client, Client

# =============================================================================
# CONFIGURATION
# =============================================================================

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

# Voices that have columns in word_pairs table
VOICES_WITH_COLUMNS = ["sarah", "marcus", "emma", "david"]

# =============================================================================
# MAIN
# =============================================================================

def make_audio_url(voice, word):
    """Build the storage URL for a word audio file."""
    # Normalize word: lowercase, handle special characters
    normalized = word.lower().strip()
    return f"{SUPABASE_URL}/storage/v1/object/public/audio/words_v2/{voice}/{normalized}.mp3"


def main():
    print("\n" + "=" * 70)
    print("🔗 WORD PAIR AUDIO LINKAGE")
    print("=" * 70)

    # Initialize
    if not all([SUPABASE_URL, SUPABASE_KEY]):
        print("❌ Missing credentials in .env")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase client initialized")

    # Get all word pairs (with pagination - Supabase default is 1000)
    print("\n📊 Loading word pairs...")
    word_pairs = []
    offset = 0
    page_size = 1000

    while True:
        result = supabase.table("word_pairs").select("id, word_1, word_2").range(offset, offset + page_size - 1).execute()
        if not result.data:
            break
        word_pairs.extend(result.data)
        if len(result.data) < page_size:
            break
        offset += page_size

    print(f"   Found {len(word_pairs)} word pairs")

    # Process in batches
    print(f"\n{'─' * 70}")
    print("🔊 Linking audio paths")
    print(f"{'─' * 70}")

    batch_size = 100
    updated = 0
    errors = []

    for i in range(0, len(word_pairs), batch_size):
        batch = word_pairs[i:i + batch_size]

        for wp in batch:
            word_1 = wp['word_1']
            word_2 = wp['word_2']

            # Build update data for all voices
            update_data = {}
            for voice in VOICES_WITH_COLUMNS:
                update_data[f"audio_1_path_{voice}"] = make_audio_url(voice, word_1)
                update_data[f"audio_2_path_{voice}"] = make_audio_url(voice, word_2)

            try:
                supabase.table("word_pairs").update(update_data).eq("id", wp['id']).execute()
                updated += 1
            except Exception as e:
                errors.append(f"{word_1}/{word_2}: {e}")

        # Progress update
        print(f"   ✅ Processed {min(i + batch_size, len(word_pairs))}/{len(word_pairs)} pairs")

    # Summary
    print(f"\n{'=' * 70}")
    print("📊 SUMMARY")
    print(f"{'=' * 70}")
    print(f"   Word pairs updated: {updated}")
    print(f"   Voices linked: {', '.join(VOICES_WITH_COLUMNS)}")
    if errors:
        print(f"   Errors: {len(errors)}")
        for e in errors[:5]:
            print(f"      - {e}")

    # Verify
    print("\n📊 Verification:")
    for voice in VOICES_WITH_COLUMNS:
        result = supabase.table("word_pairs").select("id", count="exact").not_.is_(f"audio_1_path_{voice}", "null").execute()
        print(f"   {voice}: {result.count} pairs with paths")


if __name__ == "__main__":
    main()
