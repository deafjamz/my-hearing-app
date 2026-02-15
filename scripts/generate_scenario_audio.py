#!/usr/bin/env python3
"""
MULTI-SPEAKER SCENARIO AUDIO GENERATION
========================================
Generates audio for scenario dialogue lines using appropriate voice pairings.

Voice Pairing Strategy:
- Service worker roles: Use one voice (e.g., sarah, bill)
- Customer/patient roles: Use contrasting voice (e.g., emma, michael)
- Creates natural conversation flow with distinct speakers

Voice Combinations (4 per scenario):
1. sarah (female service) + michael (male customer)
2. bill (male service) + emma (female customer)
3. alice (UK female service) + daniel (UK male customer)
4. matilda (AU female service) + charlie (AU male customer)

Usage:
    python3 scripts/generate_scenario_audio.py --pilot    # 3 scenarios × 1 combo
    python3 scripts/generate_scenario_audio.py            # All scenarios × 4 combos
    python3 scripts/generate_scenario_audio.py --combo 1  # Specific voice combo

Created: 2026-01-22
"""

import os
import sys
import json
import uuid
import time
import argparse
import subprocess
import requests
import base64
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

ELEVENLABS_API_KEY = get_key_from_env_file("ELEVENLABS_API_KEY")
SUPABASE_URL = get_key_from_env_file("SUPABASE_URL")
SUPABASE_KEY = get_key_from_env_file("SUPABASE_SERVICE_ROLE_KEY")

# Voice definitions
VOICES = {
    "sarah":   {"id": "EXAVITQu4vr4xnSDxMaL", "gender": "female", "region": "US"},
    "emma":    {"id": "OYTbf65OHHFELVut7v2H", "gender": "female", "region": "US"},
    "bill":    {"id": "pqHfZKP75CvOlQylNhV4", "gender": "male",   "region": "US"},
    "michael": {"id": "flq6f7yk4E4fJM5XTYuZ", "gender": "male",   "region": "US"},
    "alice":   {"id": "Xb7hH8MSUJpSbSDYk0k2", "gender": "female", "region": "UK"},
    "daniel":  {"id": "onwK4e9ZLuTAKqWW03F9", "gender": "male",   "region": "UK"},
    "matilda": {"id": "XrExE9yKIg1WjnnlVkGX", "gender": "female", "region": "AU"},
    "charlie": {"id": "IKne3meq5aSn9XLyUdCD", "gender": "male",   "region": "AU"},
}

# Voice combinations for multi-speaker scenarios
# Each combo: (service_worker_voice, customer_voice)
VOICE_COMBOS = [
    {"id": "combo_1", "service": "sarah",  "customer": "michael", "name": "US Female/Male"},
    {"id": "combo_2", "service": "bill",   "customer": "emma",    "name": "US Male/Female"},
    {"id": "combo_3", "service": "alice",  "customer": "daniel",  "name": "UK Female/Male"},
    {"id": "combo_4", "service": "matilda", "customer": "charlie", "name": "AU Female/Male"},
]

# Speaker role mapping to voice type
SERVICE_ROLES = [
    "Cashier", "Pharmacist", "Server", "Teller", "Driver", "Receptionist",
    "Stylist", "Employee", "Clerk", "Staff", "Baker", "Librarian",
    "Technician", "Barista"
]
CUSTOMER_ROLES = [
    "Customer", "Patient", "Guest", "Patron", "Passenger"
]

# File paths
PROGRESS_FILE = "scenario_audio_progress.json"
LOG_FILE = "scenario_audio_generation.log"

# Audio settings
TARGET_LUFS = -20.0
MAX_RETRIES = 2

# =============================================================================
# LOGGING
# =============================================================================

def log(message, end="\n"):
    print(message, end=end, flush=True)
    with open(LOG_FILE, 'a') as f:
        f.write(f"{datetime.now().isoformat()} | {message}\n")

# =============================================================================
# AUDIO GENERATION
# =============================================================================

def generate_speech(text, voice_id):
    """Generate speech audio using ElevenLabs."""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0
        }
    }

    try:
        response = requests.post(url, json=data, headers=headers, timeout=60)
        if response.status_code != 200:
            log(f"      ❌ API error: {response.status_code}")
            return None
        return response.content
    except Exception as e:
        log(f"      ❌ Generation error: {e}")
        return None


def normalize_audio(input_path, output_path):
    """Normalize audio to target LUFS."""
    try:
        cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", input_path,
            "-af", f"loudnorm=I={TARGET_LUFS}:TP=-1.5:LRA=11",
            "-ar", "44100",
            "-b:a", "192k",
            output_path
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        return os.path.exists(output_path)
    except Exception as e:
        log(f"      ❌ Normalization error: {e}")
        return False


def upload_to_supabase(supabase, local_path, storage_path):
    """Upload file to Supabase storage."""
    try:
        with open(local_path, 'rb') as f:
            file_data = f.read()
        supabase.storage.from_("audio").upload(
            storage_path,
            file_data,
            {"content-type": "audio/mpeg", "upsert": "true"}
        )
        return supabase.storage.from_("audio").get_public_url(storage_path)
    except Exception as e:
        log(f"      ❌ Upload error: {e}")
        return None


# =============================================================================
# SPEAKER ROLE MAPPING
# =============================================================================

def get_voice_for_speaker(speaker, combo):
    """Determine which voice to use based on speaker role."""
    # Check if speaker is a service role
    for role in SERVICE_ROLES:
        if role.lower() in speaker.lower():
            return combo["service"]

    # Check if speaker is a customer role
    for role in CUSTOMER_ROLES:
        if role.lower() in speaker.lower():
            return combo["customer"]

    # Default to service voice for unknown roles
    return combo["service"]


# =============================================================================
# PROCESSING
# =============================================================================

def process_scenario_item(supabase, item, scenario_title, combo):
    """Process a single dialogue line."""
    item_id = item['id']
    speaker = item['speaker']
    text = item['text']

    # Determine voice
    voice_name = get_voice_for_speaker(speaker, combo)
    voice_id = VOICES[voice_name]['id']

    # Generate audio
    audio_bytes = generate_speech(text, voice_id)
    if not audio_bytes:
        return False, None

    # Save and normalize
    raw_file = f"temp_scenario_raw_{uuid.uuid4()}.mp3"
    final_file = f"temp_scenario_final_{uuid.uuid4()}.mp3"

    with open(raw_file, 'wb') as f:
        f.write(audio_bytes)

    if not normalize_audio(raw_file, final_file):
        os.remove(raw_file)
        return False, None

    # Upload
    storage_path = f"scenarios/{combo['id']}/{item_id}.mp3"
    audio_url = upload_to_supabase(supabase, final_file, storage_path)

    # Cleanup
    os.remove(raw_file)
    os.remove(final_file)

    if not audio_url:
        return False, None

    return True, {
        'item_id': item_id,
        'voice': voice_name,
        'speaker': speaker,
        'audio_url': audio_url
    }


def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            data = json.load(f)
            return set(tuple(item) for item in data.get('completed', []))
    return set()


def save_progress(completed):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump({
            'completed': [list(item) for item in completed],
            'timestamp': datetime.now().isoformat()
        }, f, indent=2)


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="Generate scenario dialogue audio")
    parser.add_argument("--pilot", action="store_true", help="Pilot mode (3 scenarios × 1 combo)")
    parser.add_argument("--combo", type=int, choices=[1, 2, 3, 4], help="Specific voice combo")
    parser.add_argument("--dry-run", action="store_true", help="Preview without generating")
    args = parser.parse_args()

    log("\n" + "=" * 70)
    log("🎭 MULTI-SPEAKER SCENARIO AUDIO GENERATION")
    log("=" * 70)

    # Check ffmpeg
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
    except FileNotFoundError:
        log("❌ ffmpeg not found")
        sys.exit(1)

    # Initialize
    if not all([ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
        log("❌ Missing credentials in .env")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    log("✅ Supabase client initialized")

    # Get scenarios and items
    scenarios = supabase.table('scenarios').select('id, title').execute().data
    log(f"\n📍 Found {len(scenarios)} scenarios")

    # Determine combos to process
    if args.combo:
        combos = [VOICE_COMBOS[args.combo - 1]]
    elif args.pilot:
        combos = [VOICE_COMBOS[0]]  # Just first combo for pilot
        scenarios = scenarios[:3]   # Just first 3 scenarios
    else:
        combos = VOICE_COMBOS

    log(f"🎤 Voice combos: {', '.join(c['name'] for c in combos)}")

    if args.pilot:
        log(f"\n🧪 PILOT MODE: 3 scenarios × 1 combo")

    # Calculate total work
    total_items = 0
    scenario_items = {}
    for scenario in scenarios:
        items = supabase.table('scenario_items').select('*').eq(
            'scenario_id', scenario['id']
        ).order('order').execute().data
        scenario_items[scenario['id']] = items
        total_items += len(items)

    total_files = total_items * len(combos)
    log(f"\n📊 Total files to generate: {total_items} items × {len(combos)} combos = {total_files}")

    if args.dry_run:
        log("\n🔍 DRY RUN - Sample generations:")
        for scenario in scenarios[:2]:
            items = scenario_items[scenario['id']]
            log(f"\n   📍 {scenario['title']}")
            for item in items[:3]:
                voice = get_voice_for_speaker(item['speaker'], combos[0])
                log(f"      [{item['speaker']}] → {voice}: {item['text'][:30]}...")
        log(f"\n✅ Dry run complete. Run without --dry-run to generate.")
        return

    # Load progress
    completed = load_progress()
    if completed:
        log(f"\n📂 Resumed: {len(completed)} items from progress")

    # Process
    results = []
    failed = 0
    idx = 0

    for combo in combos:
        log(f"\n{'─' * 50}")
        log(f"🎤 Voice Combo: {combo['name']}")
        log(f"   Service: {combo['service']} | Customer: {combo['customer']}")

        for scenario in scenarios:
            items = scenario_items[scenario['id']]
            log(f"\n📍 {scenario['title']} ({len(items)} lines)")

            for item in items:
                idx += 1
                key = (item['id'], combo['id'])

                if key in completed:
                    log(f"   [{idx}/{total_files}] ⏭️ Already done")
                    continue

                speaker = item['speaker']
                voice = get_voice_for_speaker(speaker, combo)
                text_preview = item['text'][:25] + "..." if len(item['text']) > 25 else item['text']

                log(f"   [{idx}/{total_files}] [{speaker}→{voice}] {text_preview}", end=" ")

                success = False
                for attempt in range(MAX_RETRIES + 1):
                    success, result = process_scenario_item(supabase, item, scenario['title'], combo)
                    if success:
                        log("✅")
                        results.append(result)
                        completed.add(key)
                        save_progress(completed)
                        break
                    elif attempt < MAX_RETRIES:
                        log(f"Retry...", end=" ")
                        time.sleep(1)

                if not success:
                    log("❌")
                    failed += 1

                time.sleep(0.3)  # Rate limiting

    # Summary
    log("\n" + "=" * 70)
    log("🎯 GENERATION COMPLETE")
    log("=" * 70)
    log(f"   Total: {total_files}")
    log(f"   Success: {len(results)}")
    log(f"   Failed: {failed}")

    if results:
        log(f"\n📊 By voice combo:")
        for combo in combos:
            count = sum(1 for r in results if r['voice'] in [combo['service'], combo['customer']])
            log(f"   {combo['name']}: {count} files")


if __name__ == "__main__":
    main()
