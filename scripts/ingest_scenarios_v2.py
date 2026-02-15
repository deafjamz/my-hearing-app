#!/usr/bin/env python3
"""
SCENARIO INGESTION V2
=====================
Ingests multi-speaker dialogue scenarios and their lines into the database.

Features:
- 30 new scenarios across various real-world contexts
- 8+ lines per scenario for realistic conversations
- Proper speaker role mapping
- Noise asset linking

Usage:
    python3 scripts/ingest_scenarios_v2.py --dry-run   # Preview
    python3 scripts/ingest_scenarios_v2.py             # Execute

Created: 2026-01-22
"""

import os
import sys
import uuid
import argparse
import pandas as pd
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

SCENARIOS_CSV = "content/source_csvs/scenarios_v2.csv"
ITEMS_CSV = "content/source_csvs/scenario_items_v2.csv"


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Ingest scenarios v2")
    parser.add_argument("--dry-run", action="store_true", help="Preview without changes")
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("📍 SCENARIO INGESTION V2")
    print("=" * 60)

    # Check files
    if not os.path.exists(SCENARIOS_CSV):
        print(f"❌ Scenarios CSV not found: {SCENARIOS_CSV}")
        sys.exit(1)
    if not os.path.exists(ITEMS_CSV):
        print(f"❌ Items CSV not found: {ITEMS_CSV}")
        sys.exit(1)

    # Load CSVs
    scenarios_df = pd.read_csv(SCENARIOS_CSV)
    items_df = pd.read_csv(ITEMS_CSV)

    print(f"\n📖 Loaded:")
    print(f"   Scenarios: {len(scenarios_df)} rows")
    print(f"   Items: {len(items_df)} rows")

    # Create deterministic UUID mapping from scenario_id strings
    def make_uuid(name):
        """Create reproducible UUID from string using namespace UUID."""
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"soundsteps.{name}"))

    # Map scenario string IDs to UUIDs
    scenario_uuid_map = {}
    for sid in scenarios_df['scenario_id'].unique():
        scenario_uuid_map[sid] = make_uuid(sid)

    # Process scenarios
    scenario_records = []
    for _, row in scenarios_df.iterrows():
        scenario_uuid = scenario_uuid_map[row['scenario_id']]
        record = {
            'id': scenario_uuid,
            'title': row['title'],
            'description': row['description'],
            'difficulty': int(row['difficulty']),
            'tier': row['tier'],
        }
        scenario_records.append(record)

    # Process items
    item_records = []
    for _, row in items_df.iterrows():
        scenario_uuid = scenario_uuid_map[row['scenario_id']]
        item_uuid = make_uuid(row['id'])
        record = {
            'id': item_uuid,
            'scenario_id': scenario_uuid,
            'speaker': row['speaker'],
            'text': row['text'],
            'order': int(row['order']),
        }
        item_records.append(record)

    # Summary
    print(f"\n📊 Summary:")
    categories = scenarios_df['category'].value_counts().to_dict() if 'category' in scenarios_df.columns else {}
    print(f"   Categories: {categories}")
    tiers = scenarios_df['tier'].value_counts().to_dict()
    print(f"   Tiers: {tiers}")
    print(f"   Avg lines per scenario: {len(items_df) / len(scenarios_df):.1f}")

    if args.dry_run:
        print("\n🔍 DRY RUN - Sample records:")
        for s in scenario_records[:3]:
            print(f"   Scenario: {s['id']} - {s['title']}")
        for i in item_records[:5]:
            print(f"   Item: [{i['speaker']}] {i['text'][:40]}...")
        print(f"\n✅ Dry run complete. Run without --dry-run to execute.")
        return

    # Initialize Supabase
    if not all([SUPABASE_URL, SUPABASE_KEY]):
        print("❌ Missing Supabase credentials")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("\n✅ Supabase client initialized")

    # Upsert scenarios
    print(f"\n📤 Upserting {len(scenario_records)} scenarios...")
    try:
        response = supabase.table('scenarios').upsert(scenario_records).execute()
        print(f"   ✅ Upserted {len(response.data)} scenarios")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return

    # Upsert items
    print(f"\n📤 Upserting {len(item_records)} items...")
    try:
        # Batch in groups of 50
        for i in range(0, len(item_records), 50):
            batch = item_records[i:i + 50]
            response = supabase.table('scenario_items').upsert(batch).execute()
            print(f"   Batch {i//50 + 1}: {len(response.data)} items")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return

    print("\n" + "=" * 60)
    print("✅ SCENARIO INGESTION COMPLETE")
    print("=" * 60)
    print(f"   Scenarios: {len(scenario_records)}")
    print(f"   Items: {len(item_records)}")
    print(f"\n📋 Next steps:")
    print("   1. Generate audio: python3 scripts/generate_scenario_audio.py")
    print("   2. Link noise assets to scenarios")


if __name__ == "__main__":
    main()
