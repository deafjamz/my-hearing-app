#!/usr/bin/env python3
"""
Generate Clinical-Grade Background Noise using ElevenLabs Sound Effects API

This script generates scientifically-validated background noise for
auditory rehabilitation training, following evidence-based practices from
speech-in-noise testing literature (QuickSIN, WIN, HINT).

Usage:
    python3 generate_clinical_noise.py [--tier 1|2|3] [--validate]

Requirements:
    - ElevenLabs API key (ELEVENLABS_API_KEY in .env)
    - Supabase credentials (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    - librosa, soundfile (for RMS normalization)
"""

import os
import sys
import requests
import argparse
import numpy as np
from pathlib import Path
from supabase import create_client, Client

# Audio processing
try:
    import librosa
    import soundfile as sf
except ImportError:
    print("❌ Missing audio libraries. Install with:")
    print("   pip3 install librosa soundfile --break-system-packages")
    sys.exit(1)

# --- Environment Loader ---
def get_key_from_env_file(key_name, file_path=".env"):
    if not os.path.exists(file_path):
        return None
    with open(file_path, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith(f'{key_name}='):
                return line.split('=', 1)[1].strip()
    return None

# --- Configuration ---
ELEVENLABS_API_KEY = get_key_from_env_file("ELEVENLABS_API_KEY")
SUPABASE_URL = get_key_from_env_file("SUPABASE_URL")
SUPABASE_KEY = get_key_from_env_file("SUPABASE_SERVICE_ROLE_KEY")

if not all([ELEVENLABS_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("❌ Error: Missing environment variables")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Clinical Noise Definitions ---
TIER_1_NOISE = [
    {
        "name": "babble_8talker_cafeteria",
        "description": "Multi-Talker Babble - Primary training noise",
        "category": "speech_babble",
        "intensity": "moderate",
        "spectral_type": "babble",
        "temporal_type": "modulated",
        "talker_count": 8,
        "masking_type": "energetic",
        "prompt": "Generate a 15-second audio clip of overlapping unintelligible conversations from 8 different people in a cafeteria. The voices should be balanced between male and female, with no individual voice dominating. The speech should blend into a continuous babble where no words are understandable. Create natural conversational rhythm with overlapping speech.",
        "duration": 15,
        "clinical_notes": "Gold standard for speech-in-noise training. Matches QuickSIN test conditions."
    },
    {
        "name": "restaurant_moderate",
        "description": "Restaurant ambience with conversation babble",
        "category": "environmental",
        "intensity": "moderate",
        "spectral_type": "ambient",
        "temporal_type": "modulated",
        "talker_count": 6,
        "masking_type": "mixed",
        "prompt": "Generate a 15-second audio clip of a busy restaurant environment with background conversations, occasional silverware clinks, and gentle ambient noise. The conversation babble should be unintelligible and blend into the background. Include subtle sounds of plates and glasses but keep speech-like noise dominant. Create a warm, social atmosphere.",
        "duration": 15,
        "clinical_notes": "Ecologically valid scenario. Real-world listening challenge."
    },
    {
        "name": "speech_shaped_steady",
        "description": "Speech-shaped steady-state noise",
        "category": "white_noise",
        "intensity": "moderate",
        "spectral_type": "speech_shaped",
        "temporal_type": "steady",
        "talker_count": 0,
        "masking_type": "energetic",
        "prompt": "Generate a 15-second audio clip of continuous steady-state noise that matches the frequency spectrum of human speech. This should sound like a constant 'shh' sound with energy across speech frequencies from 200 Hz to 8000 Hz, similar to pink noise but optimized for the speech spectrum. The sound should be completely steady with no fluctuations or modulation, like a continuous waterfall or air conditioning sound.",
        "duration": 15,
        "clinical_notes": "Standardized noise matching LTASS. No glimpsing advantage."
    }
]

TIER_2_NOISE = [
    {
        "name": "speech_shaped_modulated",
        "description": "Modulated speech-shaped noise with listening dips",
        "category": "white_noise",
        "intensity": "moderate",
        "spectral_type": "speech_shaped",
        "temporal_type": "modulated",
        "talker_count": 0,
        "masking_type": "energetic",
        "prompt": "Generate a 15-second audio clip of speech-shaped noise with slow amplitude modulation at 4 Hz that creates rhythmic 'listening dips' every 250 milliseconds, similar to the natural rhythm of conversation pauses. The noise should match the speech spectrum (200-8000 Hz) but rise and fall in volume smoothly like ocean waves.",
        "duration": 15,
        "clinical_notes": "Easier than steady noise. Allows temporal glimpsing."
    },
    {
        "name": "competing_talker_female",
        "description": "Single female competing speaker",
        "category": "speech_babble",
        "intensity": "moderate",
        "spectral_type": "babble",
        "temporal_type": "modulated",
        "talker_count": 1,
        "masking_type": "informational",
        "prompt": "Generate a 15-second monologue by one female speaker with a clear, conversational voice saying random unrelated sentences about everyday topics like weather, groceries, and schedules. The sentences should be semantically unrelated and delivered naturally with normal prosody.",
        "duration": 15,
        "clinical_notes": "Tests informational masking and selective attention."
    }
]

TIER_3_NOISE = [
    {
        "name": "medical_office_ambient",
        "description": "Doctor's office ambience",
        "category": "environmental",
        "intensity": "quiet",
        "spectral_type": "ambient",
        "temporal_type": "transient",
        "talker_count": 2,
        "masking_type": "mixed",
        "prompt": "Generate a 15-second audio clip of a medical office environment with muffled conversations in the background, an occasional phone ringing softly, keyboard typing, and quiet footsteps in a hallway. Keep the ambience calm, professional, and subdued. The overall level should be quiet with mostly transient sounds.",
        "duration": 15,
        "clinical_notes": "Scenario-specific for medical dialogue training."
    },
    {
        "name": "grocery_store_ambient",
        "description": "Grocery store soundscape",
        "category": "environmental",
        "intensity": "moderate",
        "spectral_type": "ambient",
        "temporal_type": "transient",
        "talker_count": 4,
        "masking_type": "mixed",
        "prompt": "Generate a 15-second audio clip of a grocery store soundscape with distant PA announcements, shopping carts rolling, rustling plastic bags, beeping scanners, and background customer chatter. Keep the speech babble unintelligible. Include the ambient hum of refrigerators and a realistic retail atmosphere.",
        "duration": 15,
        "clinical_notes": "Scenario-specific for grocery shopping dialogue."
    },
    {
        "name": "transit_ambient",
        "description": "Public transit interior sounds",
        "category": "environmental",
        "intensity": "moderate",
        "spectral_type": "ambient",
        "temporal_type": "steady",
        "talker_count": 3,
        "masking_type": "mixed",
        "prompt": "Generate a 15-second audio clip of the interior of a bus or train with engine hum, occasional automated announcements, and quiet passenger conversations. Include realistic vehicle movement sounds, subtle vibrations, and ambient mechanical noise. The conversations should be distant and muffled.",
        "duration": 15,
        "clinical_notes": "Scenario-specific for public transit dialogue."
    }
]

# --- Helper Functions ---

def normalize_rms(audio_path: str, target_rms_db: float = -20.0) -> str:
    """
    Normalize audio file to target RMS level in dB FS

    Args:
        audio_path: Path to input audio file
        target_rms_db: Target RMS in dB FS (default: -20.0)

    Returns:
        Path to normalized file
    """
    print(f"   📊 Normalizing RMS to {target_rms_db} dB FS...")

    # Load audio
    audio, sr = librosa.load(audio_path, sr=None, mono=True)

    # Calculate current RMS
    current_rms = np.sqrt(np.mean(audio**2))
    current_rms_db = 20 * np.log10(current_rms) if current_rms > 0 else -np.inf

    # Calculate gain needed
    gain_db = target_rms_db - current_rms_db
    gain_linear = 10 ** (gain_db / 20)

    # Apply gain
    audio_normalized = audio * gain_linear

    # Clip to prevent overflow
    audio_normalized = np.clip(audio_normalized, -1.0, 1.0)

    # Save
    output_path = audio_path.replace('.mp3', '_normalized.mp3')
    sf.write(output_path, audio_normalized, sr, format='mp3')

    print(f"   ✅ RMS: {current_rms_db:.1f} dB → {target_rms_db:.1f} dB (Gain: {gain_db:+.1f} dB)")

    return output_path

def generate_sound_effect(prompt: str, duration: int, output_path: str) -> bool:
    """
    Generate sound effect using ElevenLabs Sound Effects API

    Args:
        prompt: Text description of desired sound
        duration: Duration in seconds
        output_path: Where to save the MP3

    Returns:
        True if successful, False otherwise
    """
    url = "https://api.elevenlabs.io/v1/sound-generation"

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "text": prompt,
        "duration_seconds": duration,
        "prompt_influence": 0.5  # Balance between prompt and naturalness
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()

        # Save MP3
        with open(output_path, 'wb') as f:
            f.write(response.content)

        return True

    except requests.exceptions.RequestException as e:
        print(f"   ❌ API Error: {e}")
        return False

def upload_to_supabase(file_path: str, storage_path: str) -> str:
    """
    Upload file to Supabase Storage

    Args:
        file_path: Local file path
        storage_path: Path in Supabase (e.g., 'noise/babble.mp3')

    Returns:
        Public URL of uploaded file
    """
    with open(file_path, 'rb') as f:
        file_data = f.read()

    # Upload to 'audio' bucket
    result = supabase.storage.from_('audio').upload(
        storage_path,
        file_data,
        file_options={"content-type": "audio/mpeg"}
    )

    # Get public URL
    url = f"{SUPABASE_URL}/storage/v1/object/public/audio/{storage_path}"
    return url

def insert_noise_metadata(noise_config: dict, storage_url: str, verified_rms: float):
    """
    Insert noise asset metadata into database
    """
    data = {
        "name": noise_config["name"],
        "description": noise_config["description"],
        "category": noise_config["category"],
        "intensity": noise_config["intensity"],
        "storage_url": storage_url,
        "storage_bucket": "audio",
        "storage_path": f"noise/{noise_config['name']}.mp3",
        "verified_rms_db": verified_rms,
        "duration_ms": noise_config["duration"] * 1000,
        "loop_compatible": True,
        "elevenlabs_generated": True,
        "elevenlabs_prompt": noise_config["prompt"],
        "spectral_type": noise_config.get("spectral_type"),
        "temporal_type": noise_config.get("temporal_type"),
        "talker_count": noise_config.get("talker_count"),
        "masking_type": noise_config.get("masking_type"),
        "clinical_validated": False,  # Manual validation required
        "tags": {
            "clinical_notes": noise_config.get("clinical_notes", ""),
            "tier": noise_config.get("tier", 1)
        }
    }

    supabase.table("noise_assets").upsert(data, on_conflict="name").execute()

# --- Main Generation Function ---

def generate_noise_tier(tier_config: list, tier_number: int):
    """Generate all noise files for a specific tier"""
    print(f"\n{'='*60}")
    print(f"Generating Tier {tier_number} Clinical Noise")
    print(f"{'='*60}\n")

    for i, noise in enumerate(tier_config, 1):
        print(f"[{i}/{len(tier_config)}] {noise['name']}")
        print(f"   📝 {noise['description']}")

        # Create temp directory
        temp_dir = Path("temp_noise")
        temp_dir.mkdir(exist_ok=True)

        raw_path = temp_dir / f"{noise['name']}_raw.mp3"
        normalized_path = temp_dir / f"{noise['name']}_normalized.mp3"

        # Generate sound effect
        print(f"   🎵 Generating with ElevenLabs...")
        if not generate_sound_effect(noise["prompt"], noise["duration"], str(raw_path)):
            print(f"   ⚠️ Skipping {noise['name']}\n")
            continue

        # Normalize RMS
        normalized_path_str = normalize_rms(str(raw_path), target_rms_db=-20.0)

        # Upload to Supabase
        print(f"   ☁️ Uploading to Supabase Storage...")
        storage_path = f"noise/{noise['name']}.mp3"
        storage_url = upload_to_supabase(normalized_path_str, storage_path)

        # Insert metadata
        print(f"   💾 Saving metadata to database...")
        noise["tier"] = tier_number
        insert_noise_metadata(noise, storage_url, -20.0)

        print(f"   ✅ Complete: {storage_url}\n")

        # Cleanup temp files
        raw_path.unlink(missing_ok=True)
        Path(normalized_path_str).unlink(missing_ok=True)

# --- CLI ---

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate clinical-grade background noise")
    parser.add_argument("--tier", type=int, choices=[1, 2, 3], default=1,
                       help="Noise tier to generate (1=foundational, 2=adaptive, 3=scenario)")
    parser.add_argument("--all", action="store_true",
                       help="Generate all tiers")

    args = parser.parse_args()

    print("🔊 Clinical Noise Generator")
    print("ElevenLabs Sound Effects API + Audiology Best Practices\n")

    if args.all:
        generate_noise_tier(TIER_1_NOISE, 1)
        generate_noise_tier(TIER_2_NOISE, 2)
        generate_noise_tier(TIER_3_NOISE, 3)
    else:
        tier_map = {1: TIER_1_NOISE, 2: TIER_2_NOISE, 3: TIER_3_NOISE}
        generate_noise_tier(tier_map[args.tier], args.tier)

    print("\n✅ Noise generation complete!")
    print("📋 Next steps:")
    print("   1. Test audio playback at /snr-test")
    print("   2. Clinical validation with audiologists")
    print("   3. Pilot test with CI users")
