#!/usr/bin/env python3
"""
Populate Session Items - Map Stimuli to Program Sessions
=========================================================

Purpose: Intelligently assign stimuli to sessions based on:
- Program requirements (phonemes, scenarios, difficulty)
- Session metadata (focus_phonemes, focus_scenarios, target_difficulty)
- Clinical progression logic

Usage: python3 scripts/populate_sessions.py
"""

import os
from supabase import create_client, Client
from typing import Optional, List, Dict
import random

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
# HELPER FUNCTIONS
# =====================================================================

def get_word_pairs_for_phonemes(phonemes: List[str], limit: int = 10) -> List[str]:
    """
    Get word pair IDs matching specified phonemes
    """
    try:
        # Query stimuli_catalog for word_pairs with matching phonemes
        result = supabase.table('stimuli_catalog')\
            .select('id, clinical_metadata')\
            .eq('content_type', 'word_pair')\
            .execute()

        # Filter by phonemes (check if phoneme_1_ipa or phoneme_2_ipa matches)
        matching_ids = []
        for item in result.data:
            meta = item['clinical_metadata']
            if any(p in [meta.get('phoneme_1_ipa'), meta.get('phoneme_2_ipa')] for p in phonemes):
                matching_ids.append(item['id'])

        # Shuffle and return limited set
        random.shuffle(matching_ids)
        return matching_ids[:limit]

    except Exception as e:
        print(f"   ❌ Error fetching word pairs: {e}")
        return []

def get_sentences_for_scenario_and_difficulty(scenario: str, difficulty: int, phonemes: List[str] = None, limit: int = 10) -> List[str]:
    """
    Get sentence IDs matching scenario, difficulty, and optionally phonemes
    """
    try:
        # Query stimuli_catalog for sentences
        result = supabase.table('stimuli_catalog')\
            .select('id, clinical_metadata')\
            .eq('content_type', 'sentence')\
            .execute()

        # Filter by scenario and difficulty
        matching_ids = []
        for item in result.data:
            meta = item['clinical_metadata']

            # Check scenario
            item_scenario = meta.get('scenario', '').lower()
            if scenario.lower() not in item_scenario and item_scenario not in scenario.lower():
                continue

            # Check difficulty
            item_difficulty = meta.get('difficulty')
            if item_difficulty != difficulty:
                continue

            # Optionally check phonemes
            if phonemes:
                item_phoneme = meta.get('target_phoneme')
                if not any(p in item_phoneme for p in phonemes):
                    continue

            matching_ids.append(item['id'])

        # Shuffle and return limited set
        random.shuffle(matching_ids)
        return matching_ids[:limit]

    except Exception as e:
        print(f"   ❌ Error fetching sentences: {e}")
        return []

def insert_session_items(session_id: str, stimuli_ids: List[str]) -> int:
    """
    Insert stimuli into session_items table
    Returns: Count of successfully inserted items
    """
    inserted_count = 0

    for idx, stimuli_id in enumerate(stimuli_ids, 1):
        try:
            supabase.table('session_items').insert({
                'session_id': session_id,
                'stimuli_id': stimuli_id,
                'sequence_order': idx
            }).execute()
            inserted_count += 1
        except Exception as e:
            print(f"      ⚠️  Failed to insert item {idx}: {e}")

    return inserted_count

# =====================================================================
# PROGRAM 1: FIRST WORDS (Word Pairs)
# =====================================================================

def populate_first_words_program():
    """
    Populate "First Words" program sessions with word pairs
    """
    print("=" * 80)
    print("📚 POPULATING: First Words Program")
    print("=" * 80)
    print()

    # Get program and sessions
    program = supabase.table('programs').select('*').eq('title', 'First Words').single().execute()
    if not program.data:
        print("   ❌ Program 'First Words' not found")
        return

    program_id = program.data['id']
    sessions = supabase.table('program_sessions').select('*').eq('program_id', program_id).order('session_number').execute()

    if not sessions.data:
        print("   ❌ No sessions found for 'First Words'")
        return

    print(f"   Found {len(sessions.data)} sessions")
    print()

    total_items = 0

    for session in sessions.data:
        session_id = session['id']
        session_number = session['session_number']
        title = session['title']
        focus_phonemes = session.get('focus_phonemes', [])

        print(f"   Session {session_number}: {title}")
        print(f"   Focus: {', '.join(focus_phonemes)}")

        # Get word pairs matching focus phonemes
        stimuli_ids = get_word_pairs_for_phonemes(focus_phonemes, limit=10)

        if not stimuli_ids:
            print(f"      ⚠️  No word pairs found for phonemes: {focus_phonemes}")
            continue

        # Insert items
        count = insert_session_items(session_id, stimuli_ids)
        total_items += count
        print(f"      ✅ Inserted {count} items")
        print()

    print(f"✅ Total items inserted: {total_items}")
    print("=" * 80)
    print()

# =====================================================================
# PROGRAM 2: DAILY ESSENTIALS (Sentences - Daily Life)
# =====================================================================

def populate_daily_essentials_program():
    """
    Populate "Daily Essentials" program sessions with sentences
    """
    print("=" * 80)
    print("📚 POPULATING: Daily Essentials Program")
    print("=" * 80)
    print()

    # Get program
    program = supabase.table('programs').select('*').eq('title', 'Daily Essentials').single().execute()
    if not program.data:
        print("   ❌ Program 'Daily Essentials' not found")
        return

    program_id = program.data['id']

    # Create sessions (10 sessions, each with 8 sentences, difficulty 1-2)
    print("   Creating 10 sessions with Daily Life sentences (Level 1-2)...")
    print()

    total_items = 0

    for session_num in range(1, 11):
        # Create session
        session = supabase.table('program_sessions').insert({
            'program_id': program_id,
            'session_number': session_num,
            'title': f'Daily Life Session {session_num}',
            'description': f'Practice listening to common everyday phrases',
            'focus_phonemes': [],
            'focus_scenarios': ['Daily Life'],
            'target_difficulty': 1 if session_num <= 5 else 2,
            'estimated_duration_mins': 5
        }).execute()

        if not session.data:
            print(f"      ❌ Failed to create session {session_num}")
            continue

        session_id = session.data[0]['id']

        print(f"   Session {session_num}: Daily Life (Level {1 if session_num <= 5 else 2})")

        # Get sentences
        difficulty = 1 if session_num <= 5 else 2
        stimuli_ids = get_sentences_for_scenario_and_difficulty('Daily Life', difficulty, limit=8)

        if not stimuli_ids:
            print(f"      ⚠️  No sentences found for Daily Life, Level {difficulty}")
            continue

        # Insert items
        count = insert_session_items(session_id, stimuli_ids)
        total_items += count
        print(f"      ✅ Inserted {count} items")
        print()

    print(f"✅ Total items inserted: {total_items}")
    print("=" * 80)
    print()

# =====================================================================
# PROGRAM 3: RESTAURANT READY (Sentences - Dining)
# =====================================================================

def populate_restaurant_ready_program():
    """
    Populate "Restaurant Ready" program sessions with dining sentences
    """
    print("=" * 80)
    print("📚 POPULATING: Restaurant Ready Program")
    print("=" * 80)
    print()

    # Get program
    program = supabase.table('programs').select('*').eq('title', 'Restaurant Ready').single().execute()
    if not program.data:
        print("   ❌ Program 'Restaurant Ready' not found")
        return

    program_id = program.data['id']

    # Create sessions (10 sessions, difficulty 2-4)
    print("   Creating 10 sessions with Dining sentences (Level 2-4)...")
    print()

    total_items = 0

    for session_num in range(1, 11):
        # Progressive difficulty
        if session_num <= 3:
            difficulty = 2
        elif session_num <= 7:
            difficulty = 3
        else:
            difficulty = 4

        # Create session
        session = supabase.table('program_sessions').insert({
            'program_id': program_id,
            'session_number': session_num,
            'title': f'Restaurant Session {session_num}',
            'description': f'Practice dining conversations (Level {difficulty})',
            'focus_phonemes': [],
            'focus_scenarios': ['Dining'],
            'target_difficulty': difficulty,
            'estimated_duration_mins': 5
        }).execute()

        if not session.data:
            print(f"      ❌ Failed to create session {session_num}")
            continue

        session_id = session.data[0]['id']

        print(f"   Session {session_num}: Dining (Level {difficulty})")

        # Get sentences
        stimuli_ids = get_sentences_for_scenario_and_difficulty('Dining', difficulty, limit=10)

        if not stimuli_ids:
            print(f"      ⚠️  No sentences found for Dining, Level {difficulty}")
            continue

        # Insert items
        count = insert_session_items(session_id, stimuli_ids)
        total_items += count
        print(f"      ✅ Inserted {count} items")
        print()

    print(f"✅ Total items inserted: {total_items}")
    print("=" * 80)
    print()

# =====================================================================
# MAIN
# =====================================================================

def main():
    """
    Main entry point - populate all programs
    """
    print()
    print("=" * 80)
    print("🚀 SESSION POPULATION SCRIPT")
    print("=" * 80)
    print()
    print("This script will populate session_items table with stimuli")
    print("mapped intelligently to program sessions.")
    print()

    # Populate programs
    populate_first_words_program()
    populate_daily_essentials_program()
    populate_restaurant_ready_program()

    print()
    print("=" * 80)
    print("✅ SESSION POPULATION COMPLETE")
    print("=" * 80)
    print()

if __name__ == "__main__":
    main()
