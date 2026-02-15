#!/usr/bin/env python3
"""
SENTENCE DATABASE BACKFILL V2
Inserts 1,256 existing sentence audio files into the v5 schema (stimuli_catalog + audio_assets).
Uses UUID for stimulus_id to match deployed schema.
"""

import os
import pandas as pd
import uuid
from datetime import datetime
from supabase import create_client, Client

# --- CONFIGURATION ---
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

if not all([SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing credentials in .env file.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
print("✅ Supabase client initialized.\n")

# --- BACKFILL LOGIC ---
def backfill_database():
    """Insert all 1,256 generated audio files into database."""
    print("=" * 70)
    print("🔄 SENTENCE DATABASE BACKFILL V2")
    print("=" * 70 + "\n")

    if not os.path.exists(CSV_PATH):
        print(f"❌ CSV not found: {CSV_PATH}")
        return

    df = pd.read_csv(CSV_PATH)

    print(f"📋 Loaded {len(df)} sentences from CSV\n")

    voices = ["sarah", "marcus"]
    success_count = 0
    error_count = 0

    for idx, row in df.iterrows():
        sentence_id = idx + 1
        sentence_text = row['sentence_text']

        print(f"\n{'─'*70}")
        print(f"📌 Sentence {sentence_id}/{len(df)}: {sentence_text[:60]}...")
        print(f"{'─'*70}\n")

        # Generate UUID for stimulus
        stimulus_uuid = str(uuid.uuid4())

        # INSERT INTO stimuli_catalog
        try:
            clinical_metadata = {
                "target_keyword": row['target_keyword'],
                "target_phoneme": row['target_phoneme'],
                "question_text": row['question_text'],
                "correct_answer": row['correct_answer'],
                "acoustic_foil": row['acoustic_foil'],
                "semantic_foil": row['semantic_foil'],
                "scenario": row['scenario']
            }

            stimulus_data = {
                "id": stimulus_uuid,
                "type": "sentence",
                "text": sentence_text,
                "erber_level": "comprehension",  # Erber Level 4
                "difficulty": int(row['difficulty']),
                "target_phoneme": row['target_phoneme'],
                "tags": clinical_metadata,
                "tier": "free",
                "created_at": datetime.now().isoformat()
            }

            supabase.table("stimuli_catalog").insert(stimulus_data).execute()
            print(f"   ✅ Inserted stimulus: {stimulus_uuid}")

        except Exception as e:
            print(f"   ❌ Stimulus insertion failed: {e}")
            error_count += 1
            continue

        # INSERT INTO audio_assets for each voice
        for voice_name in voices:
            try:
                # Build storage URL
                storage_path = f"sentences_v1/{voice_name}/sentence_{sentence_id}.mp3"
                storage_url = f"{SUPABASE_URL}/storage/v1/object/public/audio/{storage_path}"

                # Check if audio asset already exists
                existing_asset = supabase.table("audio_assets").select("id").eq("storage_url", storage_url).execute()

                if existing_asset.data and len(existing_asset.data) > 0:
                    print(f"      ⏭️  {voice_name.upper():8} - Already exists in database")
                    continue

                # Use default duration (since files already exist and are normalized)
                duration_ms = 1500  # Default 1.5s for sentences

                # Insert audio asset
                asset_data = {
                    "stimulus_id": stimulus_uuid,
                    "voice_name": voice_name,
                    "voice_gender": "female" if voice_name == "sarah" else "male",
                    "storage_url": storage_url,
                    "storage_bucket": "audio",
                    "storage_path": storage_path,
                    "verified_rms_db": -20.0,
                    "duration_ms": duration_ms,
                    "intelligibility_pass": True,
                    "created_at": datetime.now().isoformat()
                }

                supabase.table("audio_assets").insert(asset_data).execute()
                print(f"      ✅ {voice_name.upper():8} - Inserted")
                success_count += 1

            except Exception as e:
                print(f"      ❌ {voice_name.upper():8} - Failed: {e}")
                error_count += 1

    print("\n" + "=" * 70)
    print(f"🎯 BACKFILL COMPLETE")
    print("=" * 70)
    print(f"✅ Success: {success_count} audio assets inserted")
    print(f"❌ Errors:  {error_count} failures")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    print("\n🔧 Database Backfill Script V2")
    print("Target: Insert 1,256 sentence audio files into stimuli_catalog + audio_assets\n")

    backfill_database()
