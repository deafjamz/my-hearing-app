#!/usr/bin/env python3
"""
PHONEME DRILLS DATA INGESTION
=============================
Ingests phoneme drill minimal pairs from CSV into Supabase stimuli_catalog and audio_assets.

Usage:
    python3 scripts/ingest_phoneme_drills.py
    python3 scripts/ingest_phoneme_drills.py --dry-run

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
CSV_PATH = "content/source_csvs/phoneme_drills_v1.csv"

ALL_VOICES = ["sarah", "emma", "bill", "michael", "alice", "daniel", "matilda", "charlie", "aravind"]

# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Ingest phoneme drills into Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be inserted")
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("🎯 PHONEME DRILLS DATA INGESTION")
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
    print(f"📚 Loaded {len(df)} drill pairs from CSV")

    # Show pack breakdown
    packs = df.groupby('drill_pack_id').agg({
        'pack_name': 'first',
        'id': 'count'
    }).reset_index()
    print("\n📦 Drill Packs:")
    for _, pack in packs.iterrows():
        print(f"   {pack['drill_pack_id']}: {pack['pack_name']} ({pack['id']} pairs)")

    # Prepare stimuli_catalog records
    # Note: Actual schema uses content_text, content_type, clinical_metadata
    # id is UUID, so we generate UUIDs and store the CSV id in metadata
    import uuid

    stimuli_records = []
    id_mapping = {}  # Map CSV id to UUID for audio_assets

    for _, row in df.iterrows():
        record_uuid = str(uuid.uuid4())
        id_mapping[row['id']] = record_uuid

        record = {
            'id': record_uuid,
            'content_type': 'phoneme_drill',
            'content_text': row['word_1'],           # Primary word
            'text_alt': row['word_2'],       # Contrast word
            'target_phoneme': row['target_phoneme'],
            'contrast_phoneme': row['contrast_phoneme'],
            'phoneme_position': row['position'],
            'drill_pack_id': row['drill_pack_id'],
            'difficulty': int(row['difficulty']) if pd.notna(row.get('difficulty')) else 2,
            'tier': row.get('tier', 'free'),
            'erber_level': 'discrimination',
            'clinical_metadata': {
                'csv_id': row['id'],  # Preserve original ID
                'word_1': row['word_1'],
                'word_2': row['word_2'],
                'pack_name': row['pack_name'],
                'contrast_type': row['contrast_type'],
                'ipa_1': row.get('ipa_1', ''),
                'ipa_2': row.get('ipa_2', ''),
                'frequency_rank': row.get('frequency_rank', 'medium'),
                'clinical_note': row.get('clinical_note', '')
            }
        }
        stimuli_records.append(record)

    print(f"\n📝 Prepared {len(stimuli_records)} stimuli_catalog records")

    if args.dry_run:
        print("\n🔍 DRY RUN - Sample records:")
        for r in stimuli_records[:5]:
            print(f"   {r['id']}: {r['content_text']} vs {r['text_alt']} ({r['target_phoneme']}/{r['contrast_phoneme']})")
        return

    # Insert into stimuli_catalog
    print("\n📤 Inserting into stimuli_catalog...")
    try:
        # Batch insert
        batch_size = 100
        for i in range(0, len(stimuli_records), batch_size):
            batch = stimuli_records[i:i+batch_size]
            supabase.table('stimuli_catalog').upsert(
                batch,
                on_conflict='id'
            ).execute()
            print(f"   ✅ Batch {i//batch_size + 1}: {len(batch)} records")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        sys.exit(1)

    # Create audio_assets records
    print("\n📂 Creating audio_assets records...")
    audio_records = []

    for _, row in df.iterrows():
        csv_id = row['id']
        record_uuid = id_mapping[csv_id]
        pack_id = row['drill_pack_id']
        word_1 = row['word_1']
        word_2 = row['word_2']

        for voice in ALL_VOICES:
            # Word 1 audio
            audio_records.append({
                'stimulus_id': record_uuid,
                'voice_name': voice,
                'storage_path': f"drills/{voice}/{pack_id}/{csv_id}_{word_1}.mp3",
                'speaking_rate': 'normal'
            })
            # Word 2 audio
            audio_records.append({
                'stimulus_id': record_uuid,
                'voice_name': voice,
                'storage_path': f"drills/{voice}/{pack_id}/{csv_id}_{word_2}.mp3",
                'speaking_rate': 'normal'
            })

    print(f"   📝 Prepared {len(audio_records)} audio_assets records")

    try:
        batch_size = 500
        for i in range(0, len(audio_records), batch_size):
            batch = audio_records[i:i+batch_size]
            supabase.table('audio_assets').upsert(
                batch,
                on_conflict='stimulus_id,voice_name,storage_path'
            ).execute()
            print(f"   ✅ Batch {i//batch_size + 1}: {len(batch)} records")
    except Exception as e:
        print(f"   ⚠️ Audio assets error: {e}")

    print("\n" + "=" * 60)
    print("✅ INGESTION COMPLETE")
    print("=" * 60)
    print(f"   Drill pairs: {len(stimuli_records)}")
    print(f"   Audio links: {len(audio_records)}")
    print(f"\n📋 Next: Run drill pack summary view query to verify")


if __name__ == "__main__":
    main()
