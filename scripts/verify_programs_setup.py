#!/usr/bin/env python3
"""
Verify Programs Setup - Database State Checker
===============================================

Checks current state of the Programs architecture deployment.
"""

import os
from supabase import create_client, Client
from typing import Optional

# =====================================================================
# CONFIGURATION
# =====================================================================

def get_key_from_env_file(key_name: str, file_path: str = ".env") -> Optional[str]:
    """Read environment variable from .env file"""
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

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# =====================================================================
# VERIFICATION FUNCTIONS
# =====================================================================

def check_table_exists(table_name: str) -> bool:
    """Check if a table exists in the database"""
    try:
        result = supabase.table(table_name).select('*').limit(1).execute()
        return True
    except Exception as e:
        return False

def check_content_type_constraint():
    """Check what content types are allowed in stimuli_catalog"""
    try:
        # Try to get constraint info by checking existing data
        result = supabase.table('stimuli_catalog').select('content_type').execute()

        content_types = set()
        for item in result.data:
            content_types.add(item['content_type'])

        return content_types
    except Exception as e:
        return None

def main():
    print("=" * 80)
    print("🔍 PROGRAMS ARCHITECTURE - DATABASE STATE VERIFICATION")
    print("=" * 80)
    print()

    # Check 1: Programs Tables
    print("1️⃣  Checking Programs Tables...")
    tables = ['programs', 'program_sessions', 'session_items', 'user_program_progress']

    tables_exist = {}
    for table in tables:
        exists = check_table_exists(table)
        tables_exist[table] = exists
        status = "✅" if exists else "❌"
        print(f"   {status} {table}")

    print()

    # Check 2: Content Types
    print("2️⃣  Checking stimuli_catalog content_types...")
    content_types = check_content_type_constraint()

    if content_types:
        print(f"   Found content types: {', '.join(sorted(content_types))}")
        has_word_pair = 'word_pair' in content_types
        status = "✅" if has_word_pair else "❌"
        print(f"   {status} 'word_pair' support")
    else:
        print("   ❌ Could not read stimuli_catalog")

    print()

    # Check 3: Data Counts
    print("3️⃣  Checking Data Counts...")

    if tables_exist.get('programs'):
        try:
            programs_result = supabase.table('programs').select('*', count='exact').execute()
            print(f"   Programs: {programs_result.count}")
        except:
            print("   Programs: Error reading")

    if tables_exist.get('program_sessions'):
        try:
            sessions_result = supabase.table('program_sessions').select('*', count='exact').execute()
            print(f"   Sessions: {sessions_result.count}")
        except:
            print("   Sessions: Error reading")

    if tables_exist.get('session_items'):
        try:
            items_result = supabase.table('session_items').select('*', count='exact').execute()
            print(f"   Session Items: {items_result.count}")
        except:
            print("   Session Items: Error reading")

    try:
        word_pairs_result = supabase.table('stimuli_catalog').select('*', count='exact').eq('content_type', 'word_pair').execute()
        print(f"   Word Pairs: {word_pairs_result.count}")
    except:
        print("   Word Pairs: Error reading")

    try:
        sentences_result = supabase.table('stimuli_catalog').select('*', count='exact').eq('content_type', 'sentence').execute()
        print(f"   Sentences: {sentences_result.count}")
    except:
        print("   Sentences: Error reading")

    print()

    # Summary and Next Steps
    print("=" * 80)
    print("📋 DEPLOYMENT STATUS")
    print("=" * 80)
    print()

    all_tables_exist = all(tables_exist.values())
    has_word_pair_support = content_types and 'word_pair' in content_types

    if not all_tables_exist:
        print("❌ BLOCKED: Missing Program Tables")
        print()
        print("Next Step:")
        print("  1. Execute sql_migrations/create_programs_schema.sql in Supabase Dashboard")
        print("  2. This will create: programs, program_sessions, session_items, user_program_progress")
        print()
    elif not has_word_pair_support:
        print("❌ BLOCKED: Missing 'word_pair' Content Type Support")
        print()
        print("Next Step:")
        print("  1. Execute this SQL in Supabase Dashboard:")
        print()
        print("  ALTER TABLE stimuli_catalog")
        print("  DROP CONSTRAINT IF EXISTS stimuli_catalog_content_type_check;")
        print()
        print("  ALTER TABLE stimuli_catalog")
        print("  ADD CONSTRAINT stimuli_catalog_content_type_check")
        print("  CHECK (content_type IN ('sentence', 'story', 'word_pair'));")
        print()
    else:
        # Check if we have data
        try:
            programs_count = supabase.table('programs').select('*', count='exact').execute().count
            sessions_count = supabase.table('program_sessions').select('*', count='exact').execute().count
            items_count = supabase.table('session_items').select('*', count='exact').execute().count
            word_pairs_count = supabase.table('stimuli_catalog').select('*', count='exact').eq('content_type', 'word_pair').execute().count

            if programs_count == 0:
                print("⚠️  Tables exist but no programs loaded")
                print()
                print("Next Step:")
                print("  The schema migration includes seed data, but it wasn't loaded.")
                print("  Re-run: sql_migrations/create_programs_schema.sql")
            elif word_pairs_count == 0:
                print("⚠️  Programs exist but no word pairs")
                print()
                print("Next Step:")
                print("  python3 scripts/backfill_word_pairs.py")
            elif items_count == 0:
                print("⚠️  Programs and word pairs exist but sessions are empty")
                print()
                print("Next Step:")
                print("  python3 scripts/populate_sessions.py")
            else:
                print("✅ ALL SYSTEMS READY!")
                print()
                print("Summary:")
                print(f"  • {programs_count} programs")
                print(f"  • {sessions_count} sessions")
                print(f"  • {items_count} session items")
                print(f"  • {word_pairs_count} word pairs")
                print()
                print("You can now test the Programs UI at:")
                print("  http://localhost:5174/programs")
        except Exception as e:
            print(f"⚠️  Error checking data counts: {e}")

    print()
    print("=" * 80)

if __name__ == "__main__":
    main()
