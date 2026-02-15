#!/usr/bin/env python3
"""
SENTENCE AUDIO LINKAGE SCRIPT
=============================
Links existing sentence audio files from Supabase storage to the database.

Database Schema (actual):
- stimuli_catalog: id (UUID), content_text, content_type, clinical_metadata (JSONB)
- audio_assets: stimuli_id, storage_path, voice_id, verified_rms_db, duration_ms

Audio Location: audio/sentences_v1/{voice}/sentence_{num}.mp3
Voices: sarah, emma, bill, michael, alice, daniel, matilda, charlie, aravind (9 active)

Created: 2026-01-22
"""

import os
import sys
import pandas as pd
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
CSV_PATH = "content/source_csvs/master_sentences.csv"

# 9 active voices (excluding deprecated marcus, david)
ACTIVE_VOICES = ["sarah", "emma", "bill", "michael", "alice", "daniel", "matilda", "charlie", "aravind"]

# =============================================================================
# MAIN
# =============================================================================

def main():
    print("\n" + "=" * 70)
    print("🔗 SENTENCE AUDIO LINKAGE")
    print("=" * 70)

    # Initialize
    if not all([SUPABASE_URL, SUPABASE_KEY]):
        print("❌ Missing credentials in .env")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase client initialized")

    # Load CSV
    if not os.path.exists(CSV_PATH):
        print(f"❌ CSV not found: {CSV_PATH}")
        sys.exit(1)

    df = pd.read_csv(CSV_PATH)
    print(f"📋 Loaded {len(df)} sentences from CSV")

    # Build mapping: sentence_text -> UUID from stimuli_catalog
    print("\n📊 Building sentence text to UUID mapping...")
    result = supabase.table("stimuli_catalog").select("id, content_text").eq("content_type", "sentence").execute()
    text_to_uuid = {r['content_text']: r['id'] for r in result.data}
    print(f"   Found {len(text_to_uuid)} sentences in stimuli_catalog")

    # Build mapping: sentence_num -> UUID (via CSV text matching)
    num_to_uuid = {}
    for idx, row in df.iterrows():
        sentence_num = idx + 1
        text = row['sentence_text']
        if text in text_to_uuid:
            num_to_uuid[sentence_num] = text_to_uuid[text]

    print(f"   Mapped {len(num_to_uuid)}/{len(df)} sentences to UUIDs")

    # Check existing audio assets
    print("\n📊 Checking existing audio links...")
    result = supabase.table("audio_assets").select("stimuli_id, voice_id").like("storage_path", "sentences%").execute()
    existing_audio_keys = {(a['stimuli_id'], a['voice_id']) for a in result.data}
    print(f"   Existing sentence audio links: {len(existing_audio_keys)}")

    # Count by voice
    voice_counts = {}
    for stimuli_id, voice_id in existing_audio_keys:
        voice_counts[voice_id] = voice_counts.get(voice_id, 0) + 1
    print("   By voice: " + ", ".join(f"{v}={c}" for v, c in sorted(voice_counts.items())))

    # Link audio files for missing voices
    print(f"\n{'─' * 70}")
    print("🔊 Linking audio files to audio_assets")
    print(f"{'─' * 70}")

    audio_added = 0
    audio_skipped = 0
    errors = []

    for voice_name in ACTIVE_VOICES:
        voice_added = 0
        voice_skipped = 0

        for sentence_num, stimuli_id in num_to_uuid.items():
            # Check if already linked
            if (stimuli_id, voice_name) in existing_audio_keys:
                voice_skipped += 1
                audio_skipped += 1
                continue

            # Build storage path (1-indexed in storage)
            storage_path = f"sentences_v1/{voice_name}/sentence_{sentence_num}.mp3"

            asset_data = {
                "stimuli_id": stimuli_id,
                "voice_id": voice_name,
                "storage_path": storage_path,
                "verified_rms_db": -20.0,
                "duration_ms": 2000,
                "created_at": datetime.now().isoformat()
            }

            try:
                supabase.table("audio_assets").insert(asset_data).execute()
                audio_added += 1
                voice_added += 1
            except Exception as e:
                errors.append(f"{voice_name}/sentence_{sentence_num}: {e}")

        status = "✅" if voice_added > 0 else "⏭️ "
        print(f"   {status} {voice_name.upper():10} - Added: {voice_added}, Skipped: {voice_skipped}")

    # Summary
    print(f"\n{'=' * 70}")
    print("📊 SUMMARY")
    print(f"{'=' * 70}")
    print(f"   Audio files linked: {audio_added}")
    print(f"   Already linked (skipped): {audio_skipped}")
    if errors:
        print(f"   Errors: {len(errors)}")
        for e in errors[:5]:
            print(f"      - {e}")

    # Verify final count
    result = supabase.table("audio_assets").select("id", count="exact").like("storage_path", "sentences%").execute()
    print(f"\n   Total sentence audio in database: {result.count}")
    print(f"   Expected: {len(num_to_uuid)} sentences × {len(ACTIVE_VOICES)} voices = {len(num_to_uuid) * len(ACTIVE_VOICES)}")


if __name__ == "__main__":
    main()
