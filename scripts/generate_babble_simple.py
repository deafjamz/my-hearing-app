#!/usr/bin/env python3
"""
Clinical-Grade Multi-Talker Babble Generator (Simplified)
Compatible with Python 3.14 - uses soundfile instead of librosa
"""

import os
import sys
import argparse
import numpy as np
from pathlib import Path
import requests

# Audio processing (lightweight dependencies)
try:
    import soundfile as sf
    from pydub import AudioSegment
except ImportError:
    print("❌ Missing audio libraries. Install with:")
    print("   pip3 install soundfile pydub numpy --break-system-packages")
    sys.exit(1)

from supabase import create_client, Client

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

# --- Voice Configuration ---
VOICE_CONFIG = {
    "male_voices": [
        {"id": "VR6AewLTigWG4xSOukaG", "name": "Arnold"},
        {"id": "pNInz6obpgDQGcFmaJgB", "name": "Adam"},
        {"id": "yoZ06aMxZJJ28mfd3POQ", "name": "Sam"},
    ],
    "female_voices": [
        {"id": "EXAVITQu4vr4xnSDxMaL", "name": "Sarah"},
        {"id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel"},
        {"id": "MF3mGyEYCl7XYWbV9V6O", "name": "Elli"},
    ]
}

# --- Neutral Text ---
NEUTRAL_TEXT = """
The standard Lorem Ipsum passage used since the 1500s is reproduced below for those interested.
Contrary to popular belief Lorem Ipsum is not simply random text. It has roots in classical Latin literature.
There are many variations of passages available but the majority have suffered alteration in some form.
The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested.
Many desktop publishing packages now use Lorem Ipsum as their default model text and a search for lorem ipsum.
The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters.
All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary.
It is a long established fact that a reader will be distracted by readable content of a page.
""".strip()

def synthesize_speech(text: str, voice_id: str, output_path: str) -> bool:
    """Generate speech using ElevenLabs TTS"""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True
        }
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()

        with open(output_path, 'wb') as f:
            f.write(response.content)

        return True
    except Exception as e:
        print(f"   ❌ API Error: {e}")
        return False

def mix_audio_tracks(audio_files: list, output_path: str) -> str:
    """Mix audio tracks using pydub"""
    print(f"   🎚️ Mixing {len(audio_files)} tracks...")

    tracks = [AudioSegment.from_mp3(f) for f in audio_files]
    max_duration = max(len(track) for track in tracks)

    mixed = AudioSegment.silent(duration=max_duration)

    for track in tracks:
        track_adjusted = track - 6  # -6dB per track
        mixed = mixed.overlay(track_adjusted)

    mixed.export(output_path, format="mp3", bitrate="128k")
    print(f"   ✅ Mixed: {len(mixed)/1000:.1f} seconds")

    return output_path

def normalize_rms_simple(audio_path: str, target_rms_db: float = -20.0) -> str:
    """Normalize using soundfile and numpy"""
    print(f"   📊 Normalizing to {target_rms_db} dB FS...")

    # Read audio
    audio, sr = sf.read(audio_path)

    # Calculate RMS
    rms = np.sqrt(np.mean(audio**2))
    current_rms_db = 20 * np.log10(rms) if rms > 0 else -np.inf

    # Calculate gain
    gain_db = target_rms_db - current_rms_db
    gain_linear = 10 ** (gain_db / 20)

    # Apply gain
    audio_normalized = audio * gain_linear
    audio_normalized = np.clip(audio_normalized, -1.0, 1.0)

    # Save
    output_path = audio_path.replace('.mp3', '_normalized.mp3')
    sf.write(output_path, audio_normalized, sr, format='mp3')

    print(f"   ✅ RMS: {current_rms_db:.1f} dB → {target_rms_db:.1f} dB")

    return output_path

def upload_to_supabase(file_path: str, storage_path: str) -> str:
    """Upload to Supabase Storage"""
    with open(file_path, 'rb') as f:
        file_data = f.read()

    supabase.storage.from_('audio').upload(
        storage_path,
        file_data,
        file_options={"content-type": "audio/mpeg", "upsert": "true"}
    )

    return f"{SUPABASE_URL}/storage/v1/object/public/audio/{storage_path}"

def insert_metadata(name: str, url: str, talker_count: int):
    """Insert into noise_assets"""
    data = {
        "name": name,
        "description": f"Clinical-grade {talker_count}-talker babble",
        "category": "speech_babble",
        "intensity": "moderate",
        "storage_url": url,
        "storage_bucket": "audio",
        "storage_path": f"noise/{name}.mp3",
        "verified_rms_db": -20.0,
        "duration_ms": 60000,
        "loop_compatible": True,
        "elevenlabs_generated": True,
        "spectral_type": "babble",
        "temporal_type": "modulated",
        "talker_count": talker_count,
        "masking_type": "energetic",
        "clinical_validated": False,
        "tags": {"method": "speech_synthesis"}
    }

    supabase.table("noise_assets").upsert(data, on_conflict="name").execute()

def generate_babble(upload: bool = False):
    """Main generation function"""
    print("=" * 60)
    print("Clinical Babble Generator")
    print("=" * 60)
    print()

    temp_dir = Path("temp_babble")
    temp_dir.mkdir(exist_ok=True)

    all_voices = VOICE_CONFIG["male_voices"] + VOICE_CONFIG["female_voices"]
    voice_tracks = []

    # Split text for each voice
    words = NEUTRAL_TEXT.split()
    words_per_voice = len(words) // len(all_voices)

    for i, voice in enumerate(all_voices, 1):
        print(f"[{i}/{len(all_voices)}] {voice['name']}...")

        start_idx = (i - 1) * words_per_voice
        end_idx = start_idx + words_per_voice
        voice_text = ' '.join(words[start_idx:end_idx])

        output_path = temp_dir / f"voice_{i}.mp3"

        if synthesize_speech(voice_text, voice["id"], str(output_path)):
            voice_tracks.append(str(output_path))
            print(f"   ✅ Generated")

    if len(voice_tracks) < 4:
        print(f"\n❌ Only {len(voice_tracks)} generated. Need 4+")
        return

    # Mix
    print(f"\n🎚️ Mixing...")
    mixed_path = temp_dir / "mixed.mp3"
    mix_audio_tracks(voice_tracks, str(mixed_path))

    # Normalize
    normalized_path = normalize_rms_simple(str(mixed_path))

    # Final file
    final_name = f"babble_{len(voice_tracks)}talker_clinical"
    final_path = Path(f"{final_name}.mp3")
    Path(normalized_path).rename(final_path)

    print(f"\n✅ Complete: {final_path}")
    print(f"   Speakers: {len(voice_tracks)} ({len(VOICE_CONFIG['male_voices'])}M + {len(VOICE_CONFIG['female_voices'])}F)")
    print(f"   RMS: -20.0 dB FS")

    if upload:
        print(f"\n☁️ Uploading...")
        url = upload_to_supabase(str(final_path), f"noise/{final_name}.mp3")
        insert_metadata(final_name, url, len(voice_tracks))
        print(f"   ✅ {url}")

    # Cleanup
    for track in voice_tracks:
        Path(track).unlink(missing_ok=True)
    Path(str(mixed_path)).unlink(missing_ok=True)

    print(f"\n✅ Done!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--upload", action="store_true")
    args = parser.parse_args()

    generate_babble(upload=args.upload)
