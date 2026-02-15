#!/usr/bin/env python3
"""
ENVIRONMENTAL SOUNDS DATA INGESTION
====================================
Ingests environmental sounds from CSV into Supabase stimuli_catalog and audio_assets.

Usage:
    python3 scripts/ingest_environmental.py
    python3 scripts/ingest_environmental.py --dry-run

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
CSV_PATH = "content/source_csvs/environmental_sounds_v1.csv"

# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Ingest environmental sounds into Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be inserted")
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("🔊 ENVIRONMENTAL SOUNDS DATA INGESTION")
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
    print(f"📚 Loaded {len(df)} environmental sounds from CSV")

    # Show category breakdown
    categories = df['category'].value_counts()
    print("\n📂 Categories:")
    for cat, count in categories.items():
        print(f"   {cat}: {count} sounds")

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
            'content_type': 'environmental_sound',
            'content_text': row['correct_answer'],  # The correct answer is the display text
            'difficulty': int(row['difficulty']) if pd.notna(row.get('difficulty')) else 1,
            'tier': row.get('tier', 'free'),
            'erber_level': 'detection',
            'clinical_metadata': {
                'csv_id': row['id'],  # Preserve original ID
                'name': row['name'],
                'description': row['description'],
                'category': row['category'],
                'intensity': row['intensity'],
                'foils': [row['foil_1'], row['foil_2'], row['foil_3']],
                'acoustic_similarity': row['acoustic_similarity'],
                'safety_critical': row['safety_critical'] == 'true' or row['safety_critical'] == True
            }
        }
        stimuli_records.append(record)

    print(f"\n📝 Prepared {len(stimuli_records)} stimuli_catalog records")

    # Count safety-critical sounds
    safety_count = sum(1 for r in stimuli_records if r['clinical_metadata']['safety_critical'])
    print(f"   ⚠️ Safety-critical sounds: {safety_count}")

    if args.dry_run:
        print("\n🔍 DRY RUN - Sample records:")
        for r in stimuli_records[:5]:
            meta = r['clinical_metadata']
            print(f"   {r['id']}: {meta['name']} ({meta['category']})")
        return

    # Insert into stimuli_catalog
    print("\n📤 Inserting into stimuli_catalog...")
    try:
        result = supabase.table('stimuli_catalog').upsert(
            stimuli_records,
            on_conflict='id'
        ).execute()
        print(f"   ✅ Inserted/updated {len(stimuli_records)} records")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        sys.exit(1)

    # Create audio_assets records
    print("\n📂 Creating audio_assets records...")
    audio_records = []

    for _, row in df.iterrows():
        csv_id = row['id']
        record_uuid = id_mapping[csv_id]
        category = row['category']
        storage_path = f"environmental/{category}/{csv_id}.mp3"

        audio_records.append({
            'stimulus_id': record_uuid,
            'voice_name': 'environmental',  # Special marker for non-voice audio
            'storage_path': storage_path,
            'speaking_rate': 'normal'
        })

    print(f"   📝 Prepared {len(audio_records)} audio_assets records")

    try:
        supabase.table('audio_assets').upsert(
            audio_records,
            on_conflict='stimulus_id,voice_name,storage_path'
        ).execute()
        print(f"   ✅ Inserted {len(audio_records)} records")
    except Exception as e:
        print(f"   ⚠️ Audio assets error: {e}")

    print("\n" + "=" * 60)
    print("✅ INGESTION COMPLETE")
    print("=" * 60)
    print(f"   Environmental sounds: {len(stimuli_records)}")
    print(f"   Audio links: {len(audio_records)}")


if __name__ == "__main__":
    main()
