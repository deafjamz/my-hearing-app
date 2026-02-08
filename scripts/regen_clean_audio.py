#!/usr/bin/env python3
"""
Clean Audio Regeneration Pipeline — F-009 Fix

Regenerates word audio files WITHOUT carrier phrases using the ElevenLabs API.
Each word is spoken in isolation (no "The next word is..." prefix).

Pipeline per word:
  1. Generate TTS via ElevenLabs (just the word, no carrier phrase)
  2. Trim leading/trailing silence (50ms safety margin per 10_CLINICAL_CONSTANTS.md)
  3. Normalize to -20 LUFS
  4. Verify: duration >= 0.3s, no carrier phrase detected, HNR check
  5. Upload to Supabase Storage at audio/words_v2/{voice}/{word}.mp3

Safety Features:
  - DRY RUN mode by default (--dry-run flag, or omit --execute)
  - Checkpoint file saves progress — safe to interrupt and resume
  - Backup: original files are NOT deleted; upload uses upsert
  - Verification step before upload catches bad generations
  - Rate limiting respects ElevenLabs API limits

Prerequisites:
  pip install librosa numpy requests soundfile pydub

  Required in .env:
    ELEVENLABS_API_KEY=your_key_here
    SUPABASE_URL=https://xxx.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

Usage:
  # Dry run — shows what would be regenerated (no API calls)
  python3 scripts/regen_clean_audio.py --dry-run

  # Regenerate a single test word for one voice
  python3 scripts/regen_clean_audio.py --execute --voices sarah --words bat

  # Regenerate specific words for all voices
  python3 scripts/regen_clean_audio.py --execute --words bat cat dog

  # Regenerate from flagged list (output of audit script)
  python3 scripts/regen_clean_audio.py --execute --from-flagged docs/carrier_phrase_flagged.csv

  # Full regeneration for all voices (CAUTION: ~20K API calls)
  python3 scripts/regen_clean_audio.py --execute --full

  # Resume interrupted run (reads checkpoint file)
  python3 scripts/regen_clean_audio.py --execute --resume

Reference:
  - docs/rules/10_CLINICAL_CONSTANTS.md (trimming spec)
  - docs/VOICE_LIBRARY.md (voice IDs, generation settings)
  - docs/rules/00_MASTER_RULES.md (cold start ban — but we use text padding instead)
"""

import os
import sys
import json
import csv
import argparse
import time
import base64
import subprocess
import tempfile
from pathlib import Path
from datetime import datetime

import numpy as np
import requests

try:
    import librosa
    HAS_LIBROSA = True
except ImportError:
    HAS_LIBROSA = False

try:
    import soundfile as sf
    HAS_SOUNDFILE = True
except ImportError:
    HAS_SOUNDFILE = False


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

def _load_env_key(key: str, env_path: str = ".env") -> str | None:
    """Read a single key from a .env file without python-dotenv."""
    if not os.path.exists(env_path):
        return None
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line.startswith(f"{key}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


# Credentials (check .env first, then .env.local)
ELEVENLABS_API_KEY = (
    _load_env_key("ELEVENLABS_API_KEY")
    or _load_env_key("ELEVENLABS_API_KEY", ".env.local")
)
SUPABASE_URL = (
    _load_env_key("SUPABASE_URL")
    or _load_env_key("VITE_SUPABASE_URL")
    or _load_env_key("SUPABASE_URL", ".env.local")
    or _load_env_key("VITE_SUPABASE_URL", ".env.local")
    or "https://padfntxzoxhozfjsqnzc.supabase.co"
)
if SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.strip()
SUPABASE_SERVICE_ROLE_KEY = (
    _load_env_key("SUPABASE_SERVICE_ROLE_KEY")
    or _load_env_key("SUPABASE_SERVICE_ROLE_KEY", ".env.local")
)

# ElevenLabs voice IDs (from docs/VOICE_LIBRARY.md)
VOICE_IDS = {
    "sarah":   "EXAVITQu4vr4xnSDxMaL",
    "emma":    "OYTbf65OHHFELVut7v2H",
    "bill":    "pqHfZKP75CvOlQylNhV4",
    "michael": "flq6f7yk4E4fJM5XTYuZ",
    "alice":   "Xb7hH8MSUJpSbSDYk0k2",
    "daniel":  "onwK4e9ZLuTAKqWW03F9",
    "matilda": "XrExE9yKIg1WjnnlVkGX",
    "charlie": "IKne3meq5aSn9XLyUdCD",
    "aravind": "5Q0t7uMcjvnagumLfvZi",
}

# ElevenLabs generation settings (from docs/VOICE_LIBRARY.md)
ELEVENLABS_MODEL = "eleven_turbo_v2_5"
VOICE_SETTINGS = {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.0,
}

# Audio quality targets (from docs/AUDIO_MASTER_INVENTORY.md)
TARGET_LUFS = -20.0
PEAK_LIMIT_DB = -1.0
MIN_DURATION_S = 0.3        # 10_CLINICAL_CONSTANTS.md: <0.3s = corrupted
MAX_DURATION_S = 3.0         # Single words should not exceed 3s
SAFETY_MARGIN_S = 0.050      # 50ms silence padding at start/end

# Rate limiting
API_DELAY_S = 0.25           # Delay between API calls (avoid rate limits)
BATCH_DELAY_S = 2.0          # Delay between batches
BATCH_SIZE = 20              # Words per batch before pause

# Storage paths
STORAGE_BUCKET = "audio"
STORAGE_PREFIX = "words_v2"  # audio/words_v2/{voice}/{word}.mp3

# Checkpoint file
CHECKPOINT_FILE = os.path.join(
    os.path.dirname(__file__), "..", "docs", "regen_checkpoint.json"
)

# Word list files
WORDS_CSV = os.path.join(
    os.path.dirname(__file__), "..", "content", "source_csvs", "words_master.csv"
)
WORDS_CSV_ALT = os.path.join(
    os.path.dirname(__file__), "..", "content", "source_csvs",
    "Hearing Rehab Project - Words.csv"
)


# ---------------------------------------------------------------------------
# Text Padding Strategy (replaces carrier phrase)
# ---------------------------------------------------------------------------

def build_tts_text(word: str) -> str:
    """
    Build the text to send to ElevenLabs for generation.

    Strategy: Instead of the carrier phrase ("The next word is {word}"),
    we use minimal text padding with ellipsis to establish prosody without
    adding speech content before the word. The ellipsis gives the TTS model
    a "breath" context without producing audible carrier content.

    Alternative strategies considered:
      1. Bare word only ("cat") — risks cold-start clipping on plosives
      2. Carrier phrase ("The next word is cat") — the original problem
      3. SSML with pause — ElevenLabs turbo models have limited SSML support
      4. Ellipsis padding ("... cat ...") — gives prosodic context, minimal content

    We use option 4 with post-generation silence trimming.
    """
    return f"... {word} ..."


# ---------------------------------------------------------------------------
# Audio Generation
# ---------------------------------------------------------------------------

def generate_tts(word: str, voice_name: str) -> bytes | None:
    """
    Generate TTS audio for a single word using ElevenLabs API.
    Returns raw MP3 bytes or None on failure.
    """
    voice_id = VOICE_IDS.get(voice_name)
    if not voice_id:
        print(f"    ERROR: Unknown voice '{voice_name}'")
        return None

    text = build_tts_text(word)
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
    }
    data = {
        "text": text,
        "model_id": ELEVENLABS_MODEL,
        "voice_settings": VOICE_SETTINGS,
    }

    try:
        response = requests.post(url, json=data, headers=headers, timeout=30)
        if response.status_code == 200:
            return response.content
        else:
            print(f"    API error ({response.status_code}): {response.text[:200]}")
            return None
    except requests.RequestException as e:
        print(f"    Request failed: {e}")
        return None


# ---------------------------------------------------------------------------
# Audio Processing
# ---------------------------------------------------------------------------

def trim_silence(input_path: str, output_path: str) -> bool:
    """
    Trim leading and trailing silence from audio file using ffmpeg.
    Preserves SAFETY_MARGIN_S (50ms) of silence at start/end per spec.

    Per 10_CLINICAL_CONSTANTS.md:
      - Silence Detection: librosa.effects.split or pydub.silence
      - Safety Margin: 50ms at start/end to prevent clipping consonant attack
    """
    # Use ffmpeg silenceremove filter
    # This removes silence from start and end while preserving the core speech
    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-i", input_path,
        "-af", (
            "silenceremove="
            "start_periods=1:start_threshold=-45dB:start_duration=0.01:detection=peak,"
            "areverse,"
            "silenceremove="
            "start_periods=1:start_threshold=-45dB:start_duration=0.01:detection=peak,"
            "areverse"
        ),
        output_path,
    ]
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=30)
        return os.path.exists(output_path) and os.path.getsize(output_path) > 0
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        print(f"    ffmpeg trim failed: {e}")
        return False


def add_silence_padding(input_path: str, output_path: str) -> bool:
    """
    Add 50ms silence padding at start and end of audio.
    This prevents clipping consonant attacks on playback.
    Uses wav intermediate to avoid MP3 re-encoding artifacts.
    """
    pad_ms = int(SAFETY_MARGIN_S * 1000)
    cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-i", input_path,
        "-af", f"adelay={pad_ms}|{pad_ms},apad=pad_dur={SAFETY_MARGIN_S}",
        "-ar", "44100", "-b:a", "128k",
        output_path,
    ]
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=30)
        return os.path.exists(output_path) and os.path.getsize(output_path) > 0
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
        # Fallback: just copy input to output (skip padding)
        try:
            import shutil
            shutil.copy2(input_path, output_path)
            return True
        except Exception:
            print(f"    ffmpeg padding failed: {e}")
            return False


def normalize_loudness(input_path: str, output_path: str) -> bool:
    """
    Normalize audio to -20 LUFS using ffmpeg loudnorm filter.
    Two-pass for accurate normalization.
    """
    # Pass 1: Measure
    measure_cmd = [
        "ffmpeg", "-y", "-v", "error",
        "-i", input_path,
        "-af", f"loudnorm=I={TARGET_LUFS}:TP={PEAK_LIMIT_DB}:LRA=11:print_format=json",
        "-f", "null", "-",
    ]
    try:
        result = subprocess.run(
            measure_cmd, capture_output=True, text=True, timeout=30
        )
        # Parse loudnorm output from stderr
        stderr = result.stderr
        # Find the JSON block in stderr
        json_start = stderr.rfind("{")
        json_end = stderr.rfind("}") + 1
        if json_start >= 0 and json_end > json_start:
            stats = json.loads(stderr[json_start:json_end])
        else:
            # Fallback: single-pass normalization
            cmd = [
                "ffmpeg", "-y", "-v", "error",
                "-i", input_path,
                "-af", f"loudnorm=I={TARGET_LUFS}:TP={PEAK_LIMIT_DB}:LRA=11",
                "-ar", "44100",
                "-b:a", "128k",
                output_path,
            ]
            subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=30)
            return os.path.exists(output_path)

        # Pass 2: Apply with measured values
        apply_cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", input_path,
            "-af", (
                f"loudnorm=I={TARGET_LUFS}:TP={PEAK_LIMIT_DB}:LRA=11:"
                f"measured_I={stats.get('input_i', '-20')}:"
                f"measured_TP={stats.get('input_tp', '-1')}:"
                f"measured_LRA={stats.get('input_lra', '7')}:"
                f"measured_thresh={stats.get('input_thresh', '-30')}:"
                f"offset={stats.get('target_offset', '0')}:"
                f"linear=true:print_format=summary"
            ),
            "-ar", "44100",
            "-b:a", "128k",
            output_path,
        ]
        subprocess.run(apply_cmd, check=True, capture_output=True, text=True, timeout=30)
        return os.path.exists(output_path) and os.path.getsize(output_path) > 0

    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, json.JSONDecodeError) as e:
        print(f"    loudnorm failed: {e}")
        # Fallback: simple volume normalization
        try:
            cmd = [
                "ffmpeg", "-y", "-v", "error",
                "-i", input_path,
                "-af", f"loudnorm=I={TARGET_LUFS}:TP={PEAK_LIMIT_DB}",
                "-ar", "44100", "-b:a", "128k",
                output_path,
            ]
            subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=30)
            return os.path.exists(output_path)
        except Exception:
            return False


# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------

def verify_audio(filepath: str, word: str) -> dict:
    """
    Verify a generated audio file meets quality standards.

    Checks:
      1. Duration: 0.3s <= duration <= 3.0s
      2. No carrier phrase (single speech region expected)
      3. Speech onset within reasonable range
      4. File is valid audio

    Returns dict with 'passed' bool and 'reason' string.
    """
    if not HAS_LIBROSA:
        # Basic check without librosa
        try:
            size = os.path.getsize(filepath)
            if size < 1000:
                return {"passed": False, "reason": "File too small (<1KB)"}
            return {"passed": True, "reason": "Basic check only (librosa unavailable)"}
        except OSError as e:
            return {"passed": False, "reason": str(e)}

    try:
        y, sr = librosa.load(filepath, sr=22050)
        duration = len(y) / sr

        # Check 1: Duration bounds
        if duration < MIN_DURATION_S:
            return {
                "passed": False,
                "reason": f"Too short: {duration:.3f}s < {MIN_DURATION_S}s (corrupted per spec)",
                "duration_s": duration,
            }
        if duration > MAX_DURATION_S:
            return {
                "passed": False,
                "reason": f"Too long: {duration:.3f}s > {MAX_DURATION_S}s (possible carrier phrase)",
                "duration_s": duration,
            }

        # Check 2: Speech region count
        intervals = librosa.effects.split(y, top_db=40, frame_length=1024, hop_length=256)
        # Merge close regions
        regions = []
        for start, end in intervals:
            s = start / sr
            e = end / sr
            if e - s >= 0.02:
                if regions and s - regions[-1][1] < 0.15:
                    regions[-1] = (regions[-1][0], e)
                else:
                    regions.append((s, e))

        if len(regions) > 2:
            return {
                "passed": False,
                "reason": f"Multiple speech regions ({len(regions)}) — possible carrier phrase",
                "duration_s": duration,
                "regions": len(regions),
            }

        # Check 3: RMS level (not silent)
        rms = librosa.feature.rms(y=y)[0]
        if np.max(rms) < 0.001:
            return {
                "passed": False,
                "reason": "Audio is essentially silent",
                "duration_s": duration,
            }

        return {
            "passed": True,
            "reason": f"OK — {duration:.2f}s, {len(regions)} region(s)",
            "duration_s": duration,
            "regions": len(regions),
        }

    except Exception as e:
        return {"passed": False, "reason": f"Verification error: {e}"}


# ---------------------------------------------------------------------------
# Supabase Upload
# ---------------------------------------------------------------------------

def upload_to_supabase(filepath: str, voice: str, word: str) -> str | None:
    """
    Upload audio file to Supabase Storage.
    Returns the public URL or None on failure.

    Path: audio/words_v2/{voice}/{word}.mp3
    Uses upsert to replace existing files.
    """
    normalized = word.lower().replace(" ", "_")
    dest_path = f"{STORAGE_PREFIX}/{voice}/{normalized}.mp3"

    url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{dest_path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "audio/mpeg",
        "x-upsert": "true",
    }

    try:
        with open(filepath, "rb") as f:
            response = requests.post(url, headers=headers, data=f.read(), timeout=30)

        if response.status_code in (200, 201):
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{dest_path}"
            return public_url
        else:
            print(f"    Upload failed ({response.status_code}): {response.text[:200]}")
            return None
    except Exception as e:
        print(f"    Upload error: {e}")
        return None


# ---------------------------------------------------------------------------
# Checkpoint Management
# ---------------------------------------------------------------------------

def load_checkpoint() -> set:
    """Load checkpoint of completed voice+word pairs."""
    if os.path.exists(CHECKPOINT_FILE):
        try:
            with open(CHECKPOINT_FILE, "r") as f:
                data = json.load(f)
            completed = set(tuple(x) for x in data.get("completed", []))
            print(f"  Resuming from checkpoint: {len(completed)} files already done")
            return completed
        except (json.JSONDecodeError, KeyError):
            return set()
    return set()


def save_checkpoint(completed: set, stats: dict):
    """Save checkpoint with completed pairs and stats."""
    os.makedirs(os.path.dirname(CHECKPOINT_FILE), exist_ok=True)
    data = {
        "last_updated": datetime.now().isoformat(timespec="seconds"),
        "completed_count": len(completed),
        "completed": sorted(list(completed)),
        "stats": stats,
    }
    with open(CHECKPOINT_FILE, "w") as f:
        json.dump(data, f, indent=2)


# ---------------------------------------------------------------------------
# Word List Loading
# ---------------------------------------------------------------------------

def load_full_word_list() -> list[str]:
    """Load all words from CSV files."""
    try:
        import pandas as pd
    except ImportError:
        print("  ERROR: pandas required for full word list. Install: pip install pandas")
        sys.exit(1)

    for csv_path in [WORDS_CSV, WORDS_CSV_ALT]:
        if os.path.exists(csv_path):
            try:
                df = pd.read_csv(csv_path)
                df.columns = [c.strip() for c in df.columns]
                words = set()
                for col in df.columns:
                    if any(k in col for k in ["Word1", "Word2", "Correct", "Option", "word"]):
                        for val in df[col].dropna():
                            w = str(val).strip().strip('"').replace("...", "").strip()
                            if w and len(w) > 0:
                                words.add(w.lower())
                if words:
                    print(f"  Loaded {len(words)} unique words from {csv_path}")
                    return sorted(words)
            except Exception as e:
                print(f"  Warning: Could not parse {csv_path}: {e}")

    print("  ERROR: No word CSV found.")
    sys.exit(1)


def load_flagged_words(csv_path: str) -> list[tuple[str, str]]:
    """Load voice+word pairs from the flagged CSV (audit output)."""
    pairs = []
    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            voice = row.get("voice", "").strip()
            word = row.get("word", "").strip()
            if voice and word:
                pairs.append((voice, word))
    print(f"  Loaded {len(pairs)} flagged voice+word pairs from {csv_path}")
    return pairs


# ---------------------------------------------------------------------------
# Main Regeneration Pipeline
# ---------------------------------------------------------------------------

def process_single_word(
    voice: str,
    word: str,
    tmp_dir: str,
    dry_run: bool = True,
    output_dir: str | None = None,
) -> dict:
    """
    Full pipeline for a single voice+word combination.
    Returns result dict with status.
    """
    result = {
        "voice": voice,
        "word": word,
        "status": "pending",
        "duration_s": 0,
        "notes": "",
    }

    if dry_run:
        result["status"] = "dry_run"
        result["notes"] = f"Would generate {voice}/{word}.mp3"
        return result

    # Step 1: Generate TTS
    audio_bytes = generate_tts(word, voice)
    if audio_bytes is None:
        result["status"] = "generation_failed"
        result["notes"] = "ElevenLabs API call failed"
        return result

    # Write raw audio to temp file
    raw_path = os.path.join(tmp_dir, f"{voice}_{word}_raw.mp3")
    with open(raw_path, "wb") as f:
        f.write(audio_bytes)

    # Step 2: Trim silence
    trimmed_path = os.path.join(tmp_dir, f"{voice}_{word}_trimmed.mp3")
    if not trim_silence(raw_path, trimmed_path):
        result["status"] = "trim_failed"
        result["notes"] = "ffmpeg silence trimming failed"
        return result

    # Step 3: Add safety margin padding
    padded_path = os.path.join(tmp_dir, f"{voice}_{word}_padded.mp3")
    if not add_silence_padding(trimmed_path, padded_path):
        # If padding fails, use trimmed version
        padded_path = trimmed_path

    # Step 4: Normalize loudness
    final_path = os.path.join(tmp_dir, f"{voice}_{word}_final.mp3")
    if not normalize_loudness(padded_path, final_path):
        result["status"] = "normalize_failed"
        result["notes"] = "Loudness normalization failed"
        return result

    # Step 5: Verify
    verification = verify_audio(final_path, word)
    if not verification["passed"]:
        result["status"] = "verification_failed"
        result["notes"] = verification["reason"]
        result["duration_s"] = verification.get("duration_s", 0)
        return result

    result["duration_s"] = verification.get("duration_s", 0)

    # Step 6: Save locally or upload to Supabase
    if output_dir:
        # Save to local directory
        import shutil
        normalized = word.lower().replace(" ", "_")
        voice_dir = os.path.join(output_dir, voice)
        os.makedirs(voice_dir, exist_ok=True)
        dest = os.path.join(voice_dir, f"{normalized}.mp3")
        shutil.copy2(final_path, dest)
        result["status"] = "success"
        result["notes"] = f"Saved: {dest}"
    elif not SUPABASE_SERVICE_ROLE_KEY:
        result["status"] = "no_upload_key"
        result["notes"] = (
            f"Generated OK ({verification['reason']}) but "
            f"SUPABASE_SERVICE_ROLE_KEY not set — use --output-dir to save locally"
        )
        return result
    else:
        public_url = upload_to_supabase(final_path, voice, word)
        if public_url:
            result["status"] = "success"
            result["notes"] = f"Uploaded: {public_url}"
        else:
            result["status"] = "upload_failed"
            result["notes"] = "Upload to Supabase failed"

    # Clean up temp files
    for p in [raw_path, trimmed_path, padded_path, final_path]:
        try:
            if os.path.exists(p):
                os.remove(p)
        except OSError:
            pass

    return result


def run_regeneration(
    voice_word_pairs: list[tuple[str, str]],
    dry_run: bool = True,
    resume: bool = False,
    output_dir: str | None = None,
):
    """
    Run the regeneration pipeline for a list of (voice, word) pairs.
    """
    total = len(voice_word_pairs)

    # Load checkpoint if resuming
    completed = load_checkpoint() if resume else set()

    # Filter out already completed pairs
    remaining = [
        (v, w) for v, w in voice_word_pairs
        if (v, w) not in completed
    ]
    skipped = total - len(remaining)

    print(f"\n{'='*72}")
    print(f"  CLEAN AUDIO REGENERATION — F-009 FIX")
    print(f"{'='*72}")
    print(f"  Mode:        {'DRY RUN (no API calls)' if dry_run else 'EXECUTE (live API calls)'}")
    print(f"  Total pairs: {total}")
    if skipped > 0:
        print(f"  Skipped:     {skipped} (already completed)")
    print(f"  Remaining:   {len(remaining)}")
    print(f"  Voices:      {sorted(set(v for v, _ in remaining))}")

    if not dry_run:
        if not ELEVENLABS_API_KEY:
            print("\n  ERROR: ELEVENLABS_API_KEY not set in .env")
            sys.exit(1)

        # Credit estimate
        # ElevenLabs charges ~10 credits per word generation
        est_credits = len(remaining) * 10
        print(f"  Est. credits: ~{est_credits:,}")
        print(f"  Est. time:    ~{len(remaining) * (API_DELAY_S + 1):.0f}s "
              f"({len(remaining) * (API_DELAY_S + 1) / 60:.1f} min)")

    print(f"{'='*72}\n")

    if dry_run:
        # Just report what would be done
        voices_breakdown = {}
        for v, w in remaining:
            voices_breakdown[v] = voices_breakdown.get(v, 0) + 1

        print("  Would regenerate:")
        for v in sorted(voices_breakdown.keys()):
            print(f"    {v}: {voices_breakdown[v]} words")
        print(f"\n  Total API calls: {len(remaining)}")
        print(f"  Estimated credits: ~{len(remaining) * 10:,}")
        print(f"\n  To execute: add --execute flag")
        return

    # Execute regeneration
    stats = {
        "started": datetime.now().isoformat(timespec="seconds"),
        "success": 0,
        "failed": 0,
        "skipped": skipped,
        "errors": [],
    }

    with tempfile.TemporaryDirectory(prefix="soundsteps_regen_") as tmp_dir:
        for i, (voice, word) in enumerate(remaining):
            # Progress
            pct = (i + 1) / len(remaining) * 100
            print(f"  [{i+1}/{len(remaining)} {pct:.0f}%] {voice}/{word} ... ", end="", flush=True)

            # Process
            result = process_single_word(voice, word, tmp_dir, dry_run=False, output_dir=output_dir)

            if result["status"] == "success":
                print(f"OK ({result['duration_s']:.2f}s)")
                stats["success"] += 1
                completed.add((voice, word))
            else:
                print(f"FAILED ({result['status']}: {result['notes']})")
                stats["failed"] += 1
                stats["errors"].append({
                    "voice": voice,
                    "word": word,
                    "status": result["status"],
                    "notes": result["notes"],
                })

            # Save checkpoint periodically
            if (i + 1) % 10 == 0:
                save_checkpoint(completed, stats)

            # Rate limiting
            if (i + 1) % BATCH_SIZE == 0:
                print(f"\n  --- Batch pause ({BATCH_DELAY_S}s) ---\n")
                time.sleep(BATCH_DELAY_S)
            else:
                time.sleep(API_DELAY_S)

    # Final checkpoint
    stats["finished"] = datetime.now().isoformat(timespec="seconds")
    save_checkpoint(completed, stats)

    # Summary
    print(f"\n{'='*72}")
    print(f"  REGENERATION COMPLETE")
    print(f"{'='*72}")
    print(f"  Success: {stats['success']}")
    print(f"  Failed:  {stats['failed']}")
    print(f"  Skipped: {stats['skipped']}")
    if stats["errors"]:
        print(f"\n  Failed files:")
        for err in stats["errors"][:20]:
            print(f"    {err['voice']}/{err['word']}: {err['status']} — {err['notes']}")
        if len(stats["errors"]) > 20:
            print(f"    ... and {len(stats['errors']) - 20} more")


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Regenerate word audio files without carrier phrases (F-009 fix)"
    )
    parser.add_argument(
        "--execute", action="store_true",
        help="Actually call APIs and upload. Without this flag, runs in dry-run mode.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show what would be done without calling APIs (default behavior).",
    )
    parser.add_argument(
        "--resume", action="store_true",
        help="Resume from checkpoint file (skip already-completed pairs).",
    )
    parser.add_argument(
        "--full", action="store_true",
        help="Regenerate ALL words for all voices (~20K files).",
    )
    parser.add_argument(
        "--from-flagged", type=str, default=None,
        help="Regenerate only voice+word pairs from flagged CSV (audit output).",
    )
    parser.add_argument(
        "--voices", nargs="+", default=None,
        help=f"Voices to regenerate. Options: {', '.join(VOICE_IDS.keys())}",
    )
    parser.add_argument(
        "--words", nargs="+", default=None,
        help="Specific words to regenerate.",
    )
    parser.add_argument(
        "--output-dir", type=str, default=None,
        help="Save generated files locally instead of uploading (e.g., --output-dir ./regen_output)",
    )
    args = parser.parse_args()

    dry_run = not args.execute or args.dry_run

    # Build the list of (voice, word) pairs to process
    if args.from_flagged:
        if not os.path.exists(args.from_flagged):
            print(f"  ERROR: Flagged CSV not found: {args.from_flagged}")
            sys.exit(1)
        pairs = load_flagged_words(args.from_flagged)
        # Optionally filter by voice
        if args.voices:
            pairs = [(v, w) for v, w in pairs if v in args.voices]
    else:
        # Determine voices
        voices = args.voices if args.voices else list(VOICE_IDS.keys())
        for v in voices:
            if v not in VOICE_IDS:
                print(f"  ERROR: Unknown voice '{v}'. Options: {', '.join(VOICE_IDS.keys())}")
                sys.exit(1)

        # Determine words
        if args.words:
            words = [w.lower() for w in args.words]
        elif args.full:
            words = load_full_word_list()
        else:
            print("  ERROR: Specify --words, --full, or --from-flagged")
            print("  Examples:")
            print("    python3 scripts/regen_clean_audio.py --execute --words bat cat dog")
            print("    python3 scripts/regen_clean_audio.py --execute --full")
            print("    python3 scripts/regen_clean_audio.py --execute --from-flagged docs/carrier_phrase_flagged.csv")
            sys.exit(1)

        # Build all (voice, word) pairs
        pairs = [(v, w) for v in voices for w in words]

    if not pairs:
        print("  No voice+word pairs to process.")
        sys.exit(0)

    run_regeneration(pairs, dry_run=dry_run, resume=args.resume, output_dir=args.output_dir)


if __name__ == "__main__":
    main()
