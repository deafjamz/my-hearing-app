#!/usr/bin/env python3
"""
STORY INGESTION PIPELINE V2
===========================
Ingests 50 stories and 200+ questions from CSV to Supabase database.

The v2 content follows clinical specifications:
- 5 categories: daily_life, health_wellness, workplace_social, travel_adventure, creative_whimsical
- 5 difficulty levels with progressive complexity
- 4 question types: detail, inference, sequence, main_idea
- Free (20) and Paid (30) tier distribution

Usage:
    python3 scripts/ingest_stories_v2.py              # Full ingestion
    python3 scripts/ingest_stories_v2.py --dry-run   # Preview without changes
    python3 scripts/ingest_stories_v2.py --validate  # Validate CSV structure only

Created: 2026-01-21
"""

import os
import sys
import json
import argparse
import pandas as pd
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

STORIES_CSV = "content/source_csvs/stories_v3.csv"
QUESTIONS_CSV = "content/source_csvs/story_questions_v2.csv"

# Expected schema
STORY_COLUMNS = ['id', 'title', 'transcript', 'category', 'difficulty_level', 'word_count', 'tier', 'phonemic_targets']
QUESTION_COLUMNS = ['id', 'story_id', 'question_text', 'question_type', 'answer_options', 'correct_answer', 'difficulty_level', 'phonemic_target']

VALID_CATEGORIES = ['daily_life', 'health_wellness', 'workplace_social', 'travel_adventure', 'creative_whimsical']
VALID_TIERS = ['free', 'paid', 'Free', 'Paid', '1', '2', '3', 1, 2, 3]
VALID_QUESTION_TYPES = ['detail', 'inference', 'sequence', 'main_idea', 'factual', 'inferential', 'vocabulary']

# =============================================================================
# VALIDATION
# =============================================================================

def validate_stories(df):
    """Validate stories DataFrame."""
    errors = []

    # Check columns
    missing_cols = set(STORY_COLUMNS) - set(df.columns)
    if missing_cols:
        errors.append(f"Missing columns in stories: {missing_cols}")

    # Check IDs are unique
    if df['id'].duplicated().any():
        dups = df[df['id'].duplicated()]['id'].tolist()
        errors.append(f"Duplicate story IDs: {dups}")

    # Check categories
    invalid_cats = df[~df['category'].isin(VALID_CATEGORIES)]['category'].unique()
    if len(invalid_cats) > 0:
        errors.append(f"Invalid categories: {invalid_cats}")

    # Check tiers (handle both string and numeric tier values)
    valid_tier_strs = [str(t).lower() for t in VALID_TIERS]
    invalid_tiers = df[~df['tier'].astype(str).str.lower().isin(valid_tier_strs)]['tier'].unique()
    if len(invalid_tiers) > 0:
        errors.append(f"Invalid tiers: {invalid_tiers}")

    # Check difficulty levels
    if not df['difficulty_level'].between(1, 5).all():
        invalid = df[~df['difficulty_level'].between(1, 5)]['id'].tolist()
        errors.append(f"Invalid difficulty levels for stories: {invalid}")

    # Check transcripts are non-empty
    empty_transcripts = df[df['transcript'].str.len() < 50]['id'].tolist()
    if empty_transcripts:
        errors.append(f"Stories with short/empty transcripts: {empty_transcripts}")

    return errors


def validate_questions(df, story_ids):
    """Validate questions DataFrame."""
    errors = []

    # Check columns
    missing_cols = set(QUESTION_COLUMNS) - set(df.columns)
    if missing_cols:
        errors.append(f"Missing columns in questions: {missing_cols}")

    # Check IDs are unique
    if df['id'].duplicated().any():
        dups = df[df['id'].duplicated()]['id'].tolist()
        errors.append(f"Duplicate question IDs: {dups}")

    # Check story references
    invalid_refs = df[~df['story_id'].isin(story_ids)]['story_id'].unique()
    if len(invalid_refs) > 0:
        errors.append(f"Invalid story references: {invalid_refs}")

    # Check question types
    invalid_types = df[~df['question_type'].isin(VALID_QUESTION_TYPES)]['question_type'].unique()
    if len(invalid_types) > 0:
        errors.append(f"Invalid question types: {invalid_types}")

    # Check answer_options format
    for idx, row in df.iterrows():
        try:
            options = json.loads(row['answer_options']) if isinstance(row['answer_options'], str) else row['answer_options']
            if not isinstance(options, list) or len(options) < 3:
                errors.append(f"Question {row['id']} has invalid answer_options format")
        except json.JSONDecodeError:
            errors.append(f"Question {row['id']} has invalid JSON in answer_options")

    # Check correct_answer is in options
    for idx, row in df.iterrows():
        try:
            options = json.loads(row['answer_options']) if isinstance(row['answer_options'], str) else row['answer_options']
            if row['correct_answer'] not in options:
                errors.append(f"Question {row['id']}: correct_answer '{row['correct_answer']}' not in options")
        except:
            pass

    return errors


# =============================================================================
# DATA PROCESSING
# =============================================================================

def _normalize_tier(tier_value):
    """Normalize tier to 'Free' or 'Paid' (handles string and numeric formats)."""
    tier_str = str(tier_value).strip().lower()
    if tier_str in ('free', '1'):
        return 'Free'
    return 'Paid'  # '2', '3', 'paid', 'standard', 'premium' all map to Paid


def process_stories(df):
    """Process stories DataFrame for database ingestion.

    Note: Only inserts columns that exist in the current schema:
    - id, title, transcript, tier, phonemic_targets

    Category, difficulty_level, and word_count are stored in CSV
    but not yet in database (pending schema migration).
    """
    records = []
    for _, row in df.iterrows():
        record = {
            'id': row['id'],
            'title': row['title'],
            'transcript': row['transcript'],
            'tier': _normalize_tier(row['tier']),
        }

        # Handle phonemic_targets array
        if pd.notna(row.get('phonemic_targets')) and row['phonemic_targets']:
            targets = str(row['phonemic_targets']).strip('{}').split(',')
            record['phonemic_targets'] = [t.strip() for t in targets if t.strip()]
        else:
            record['phonemic_targets'] = []

        records.append(record)

    return records


def process_questions(df):
    """Process questions DataFrame for database ingestion."""
    records = []
    for _, row in df.iterrows():
        record = {
            'id': row['id'],
            'story_id': row['story_id'],
            'question_text': row['question_text'],
            'question_type': row['question_type'],
            'correct_answer': row['correct_answer'],
            'difficulty_level': int(row['difficulty_level']),
        }

        # Parse answer_options JSON
        if isinstance(row['answer_options'], str):
            record['answer_options'] = json.loads(row['answer_options'])
        else:
            record['answer_options'] = row['answer_options']

        # Handle phonemic_target
        if pd.notna(row.get('phonemic_target')) and row['phonemic_target']:
            record['phonemic_target'] = row['phonemic_target']
        else:
            record['phonemic_target'] = None

        records.append(record)

    return records


# =============================================================================
# DATABASE OPERATIONS
# =============================================================================

def upsert_stories(supabase, records, dry_run=False):
    """Upsert stories to database."""
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Upserting {len(records)} stories...")

    if dry_run:
        for r in records[:3]:
            print(f"   Would upsert: {r['id']} - {r['title'][:40]}...")
        print(f"   ... and {len(records) - 3} more")
        return True

    try:
        response = supabase.table('stories').upsert(records).execute()
        if response.data:
            print(f"   ✅ Successfully upserted {len(response.data)} stories")
            return True
        else:
            print(f"   ❌ Error: No data returned")
            return False
    except Exception as e:
        print(f"   ❌ Error upserting stories: {e}")
        return False


def upsert_questions(supabase, records, dry_run=False):
    """Upsert questions to database."""
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Upserting {len(records)} questions...")

    if dry_run:
        for r in records[:3]:
            print(f"   Would upsert: {r['id']} - {r['question_text'][:40]}...")
        print(f"   ... and {len(records) - 3} more")
        return True

    try:
        response = supabase.table('story_questions').upsert(records).execute()
        if response.data:
            print(f"   ✅ Successfully upserted {len(response.data)} questions")
            return True
        else:
            print(f"   ❌ Error: No data returned")
            return False
    except Exception as e:
        print(f"   ❌ Error upserting questions: {e}")
        return False


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Ingest stories v2 content to database")
    parser.add_argument("--dry-run", action="store_true", help="Preview without making changes")
    parser.add_argument("--validate", action="store_true", help="Validate CSV structure only")
    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("📚 STORY INGESTION PIPELINE V2")
    print("=" * 60)

    # Check files exist
    if not os.path.exists(STORIES_CSV):
        print(f"❌ Error: Stories CSV not found: {STORIES_CSV}")
        sys.exit(1)
    if not os.path.exists(QUESTIONS_CSV):
        print(f"❌ Error: Questions CSV not found: {QUESTIONS_CSV}")
        sys.exit(1)

    # Load CSVs
    print("\n📖 Loading CSV files...")
    stories_df = pd.read_csv(STORIES_CSV)
    questions_df = pd.read_csv(QUESTIONS_CSV)

    print(f"   Stories: {len(stories_df)} rows")
    print(f"   Questions: {len(questions_df)} rows")

    # Validate
    print("\n🔍 Validating data...")
    story_errors = validate_stories(stories_df)
    question_errors = validate_questions(questions_df, stories_df['id'].tolist())

    all_errors = story_errors + question_errors
    if all_errors:
        print("\n❌ Validation errors found:")
        for err in all_errors:
            print(f"   - {err}")
        sys.exit(1)
    else:
        print("   ✅ All validations passed")

    # Summary stats
    print("\n📊 Content Summary:")
    print(f"   Categories: {stories_df['category'].value_counts().to_dict()}")
    print(f"   Difficulty levels: {stories_df['difficulty_level'].value_counts().sort_index().to_dict()}")
    print(f"   Tiers: {stories_df['tier'].value_counts().to_dict()}")
    print(f"   Question types: {questions_df['question_type'].value_counts().to_dict()}")
    print(f"   Questions per story: {len(questions_df) / len(stories_df):.1f} avg")

    if args.validate:
        print("\n✅ Validation complete (--validate mode, no database changes)")
        return

    # Initialize Supabase
    if not args.dry_run:
        if not all([SUPABASE_URL, SUPABASE_KEY]):
            print("\n❌ Error: Missing Supabase credentials in .env file")
            sys.exit(1)

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("\n✅ Supabase client initialized")
    else:
        supabase = None

    # Process data
    print("\n🔄 Processing data...")
    story_records = process_stories(stories_df)
    question_records = process_questions(questions_df)

    # Upsert
    if args.dry_run:
        print("\n" + "-" * 40)
        print("🔍 DRY RUN MODE - No changes will be made")
        print("-" * 40)

    stories_ok = upsert_stories(supabase, story_records, dry_run=args.dry_run)
    questions_ok = upsert_questions(supabase, question_records, dry_run=args.dry_run)

    # Final status
    print("\n" + "=" * 60)
    if args.dry_run:
        print("🔍 DRY RUN COMPLETE")
        print("   Run without --dry-run to apply changes")
    elif stories_ok and questions_ok:
        print("✅ INGESTION COMPLETE")
        print(f"   Stories: {len(story_records)} upserted")
        print(f"   Questions: {len(question_records)} upserted")
        print("\n📋 Next steps:")
        print("   1. Run audio generation: python3 scripts/generate_stories_v2.py --pilot")
        print("   2. Verify in app: Check story list and playback")
    else:
        print("❌ INGESTION FAILED")
        print("   Check errors above and retry")
    print("=" * 60)


if __name__ == "__main__":
    main()
