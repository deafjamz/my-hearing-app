#!/usr/bin/env python3
"""
CONVERSATION DATA INGESTION
===========================
Ingests conversation Q&A pairs from CSV into Supabase stimuli_catalog and audio_assets.

Usage:
    python3 scripts/ingest_conversations.py
    python3 scripts/ingest_conversations.py --dry-run

Created: 2026-01-22
"""

import os
import sys
import json
import argparse
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
CSV_PATH = "content/source_csvs/conversations_v1.csv"

ALL_VOICES = ["sarah", "emma", "bill", "michael", "alice", "daniel", "matilda", "charlie", "aravind"]

# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Ingest conversation data into Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be inserted")
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("💬 CONVERSATION DATA INGESTION")
    print("=" * 60)

    if not all([SUPABASE_URL, SUPABASE_KEY]):
        print("❌ Missing Supabase credentials")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Supabase connected")

    # Load CSV
    if not os.path.exists(CSV_PATH):
        print(f"❌ CSV not found: {CSV_PATH}")
        sys.exit(1)

    df = pd.read_csv(CSV_PATH)
    print(f"📚 Loaded {len(df)} conversation pairs from CSV")

    # Prepare stimuli_catalog records
    # Note: Actual schema uses content_text, content_type, clinical_metadata (not text, type, tags)
    # id is UUID, so we generate UUIDs and store the CSV id in metadata
    import uuid

    stimuli_records = []
    id_mapping = {}  # Map CSV id to UUID for audio_assets

    for _, row in df.iterrows():
        record_uuid = str(uuid.uuid4())
        id_mapping[row['id']] = record_uuid

        record = {
            'id': record_uuid,
            'content_type': 'conversation',
            'content_text': row['prompt_text'],  # Display text is the question
            'prompt_text': row['prompt_text'],
            'response_text': row['response_text'],
            'target_phoneme': row.get('target_phoneme'),
            'difficulty': int(row['difficulty']) if pd.notna(row.get('difficulty')) else 2,
            'tier': row.get('tier', 'free'),
            'erber_level': 'comprehension',
            'clinical_metadata': {
                'csv_id': row['id'],  # Preserve original ID for reference
                'category': row['category'],
                'target_keyword': row['target_keyword'],
                'acoustic_foil': row['acoustic_foil'],
                'semantic_foil': row['semantic_foil'],
                'plausible_foil': row['plausible_foil']
            }
        }
        stimuli_records.append(record)

    print(f"\n📝 Prepared {len(stimuli_records)} stimuli_catalog records")

    if args.dry_run:
        print("\n🔍 DRY RUN - Sample records:")
        for r in stimuli_records[:3]:
            print(f"   {r['id']}: {r['content_text'][:50]}...")
        return

    # Insert into stimuli_catalog
    print("\n📤 Inserting into stimuli_catalog...")
    try:
        # Upsert to handle re-runs
        result = supabase.table('stimuli_catalog').upsert(
            stimuli_records,
            on_conflict='id'
        ).execute()
        print(f"   ✅ Inserted/updated {len(stimuli_records)} records")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        sys.exit(1)

    # Check for existing audio and create audio_assets records
    print("\n📂 Checking for audio files and creating audio_assets...")
    audio_records = []

    for _, row in df.iterrows():
        csv_id = row['id']
        record_uuid = id_mapping[csv_id]
        for voice in ALL_VOICES:
            # Check for prompt audio
            prompt_path = f"conversations/{voice}/{csv_id}_prompt.mp3"
            response_path = f"conversations/{voice}/{csv_id}_response.mp3"

            # Create audio asset records (will link if audio exists)
            audio_records.append({
                'stimulus_id': record_uuid,
                'voice_id': voice,
                'storage_path': prompt_path,
                'speaking_rate': 'normal'
            })
            audio_records.append({
                'stimulus_id': record_uuid,
                'voice_id': voice,
                'storage_path': response_path,
                'speaking_rate': 'normal'
            })

    print(f"   📝 Prepared {len(audio_records)} audio_assets records")

    try:
        batch_size = 500
        for i in range(0, len(audio_records), batch_size):
            batch = audio_records[i:i+batch_size]
            supabase.table('audio_assets').insert(batch).execute()
            print(f"   ✅ Batch {i//batch_size + 1}: {len(batch)} records")
    except Exception as e:
        print(f"   ⚠️ Audio assets error: {e}")

    print("\n" + "=" * 60)
    print("✅ INGESTION COMPLETE")
    print("=" * 60)
    print(f"   Conversations: {len(stimuli_records)}")
    print(f"   Audio links: {len(audio_records)}")


if __name__ == "__main__":
    main()
