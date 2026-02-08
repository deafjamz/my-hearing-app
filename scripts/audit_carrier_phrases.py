#!/usr/bin/env python3
"""
Carrier Phrase Audit — F-009 Comprehensive Detection Pipeline

Downloads word audio files from Supabase Storage and analyzes them for
carrier phrase contamination ("The next word is ___" / "The word is ___").

Detection Methods:
  1. Duration analysis — carrier-contaminated files are typically >1.5s
  2. Speech onset detection — uses librosa RMS energy to find where speech begins
  3. Multi-onset detection — carrier phrases create TWO speech bursts (phrase + word)
  4. Silence gap detection — carrier phrases have a characteristic gap before the target

Outputs:
  - Console report with per-voice and overall statistics
  - JSON report at docs/carrier_phrase_audit.json
  - CSV of flagged files at docs/carrier_phrase_flagged.csv

Configuration:
  - Set SUPABASE_URL below or in .env file
  - Adjust SAMPLE_SIZE for broader/narrower audit
  - Set FULL_AUDIT=True to check ALL words (slow — downloads ~1,847 files per voice)

Dependencies:
  pip install librosa numpy requests soundfile

Usage:
  python3 scripts/audit_carrier_phrases.py                  # Sample audit (fast)
  python3 scripts/audit_carrier_phrases.py --full            # Full audit (all words)
  python3 scripts/audit_carrier_phrases.py --voices sarah    # Single voice
  python3 scripts/audit_carrier_phrases.py --voices sarah alice daniel  # Multiple voices
  python3 scripts/audit_carrier_phrases.py --words bat cat dog  # Specific words

Reference: docs/rules/10_CLINICAL_CONSTANTS.md Section 4 "Audio Processing Physics"
  - Pre-Trim: ~1.3 seconds (removes "The next word is")
  - Silence Detection: librosa.effects.split or pydub.silence
  - Safety Margin: 50ms at start/end
  - Min Duration Flag: <0.3s = "Corrupted"
"""

import os
import sys
import json
import csv
import argparse
import tempfile
import time
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

# Try to load SUPABASE_URL from .env if available
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


SUPABASE_URL = (
    _load_env_key("SUPABASE_URL")
    or _load_env_key("VITE_SUPABASE_URL")
    or _load_env_key("SUPABASE_URL", ".env.local")
    or _load_env_key("VITE_SUPABASE_URL", ".env.local")
    or "https://padfntxzoxhozfjsqnzc.supabase.co"
)
# Strip any trailing whitespace from env values
SUPABASE_URL = SUPABASE_URL.strip()
STORAGE_BASE = f"{SUPABASE_URL}/storage/v1/object/public/audio/words_v2"

# 9-voice clinical roster (docs/VOICE_LIBRARY.md)
ALL_VOICES = [
    "sarah", "emma", "bill", "michael",
    "alice", "daniel",
    "matilda", "charlie",
    "aravind",
]

# Representative word sample — covers monosyllabic, bisyllabic, different phoneme onsets
# These are confirmed to exist in words_v2/ based on prior audit
SAMPLE_WORDS = [
    # Short monosyllabic — plosive onsets
    "bat", "cat", "dog", "pig", "cup",
    "bed", "pen", "hat", "bus", "leg",
    # Short monosyllabic — fricative/nasal/liquid onsets
    "food", "sun", "net", "run", "van",
    "fan", "map", "lip", "zip", "mud",
    # Monosyllabic — longer vowels
    "pond", "chair", "cheese", "house", "phone",
    "train", "ship", "water", "tree", "moon",
    # Words that were flagged in prior user testing
    "bear", "pear", "rival", "rack", "sack",
    "tin", "thin", "sin", "fin", "win",
]

# Word list file for full audit (from content/source_csvs/)
WORDS_CSV = os.path.join(
    os.path.dirname(__file__), "..", "content", "source_csvs", "words_master.csv"
)
WORDS_CSV_ALT = os.path.join(
    os.path.dirname(__file__), "..", "content", "source_csvs",
    "Hearing Rehab Project - Words.csv"
)

# ---------------------------------------------------------------------------
# Thresholds (calibrated from 10_CLINICAL_CONSTANTS.md + prior audit data)
# ---------------------------------------------------------------------------

# Duration thresholds
CARRIER_MIN_DURATION_S = 1.5      # Files >1.5s likely have carrier phrase intact
CLEAN_MAX_DURATION_S = 1.2        # Clean single words are typically <1.2s
CORRUPTED_MIN_DURATION_S = 0.3    # Files <0.3s flagged as corrupted per spec

# Onset thresholds
ONSET_CLIP_THRESHOLD_S = 0.005    # Speech starting <5ms suggests clipped onset
LATE_ONSET_THRESHOLD_S = 0.300    # Speech starting >300ms suggests carrier remnant

# Multi-onset detection (carrier phrase = 2+ speech regions)
SILENCE_SPLIT_DB = -40            # dB threshold for silence detection
MIN_SILENCE_GAP_S = 0.15         # Minimum gap between speech regions to count as separate

# Carrier phrase typical characteristics
CARRIER_PHRASE_DURATION_S = 1.3   # "The next word is" takes ~1.3s
CARRIER_ONSET_WINDOW_S = 0.1     # Carrier phrase speech starts within first 100ms


# ---------------------------------------------------------------------------
# File Download
# ---------------------------------------------------------------------------

def download_file(voice: str, word: str, tmp_dir: str) -> str | None:
    """Download an audio file from Supabase Storage. Returns local path or None."""
    normalized = word.lower().replace(" ", "_")
    url = f"{STORAGE_BASE}/{voice}/{normalized}.mp3"
    local_path = os.path.join(tmp_dir, f"{voice}_{normalized}.mp3")

    try:
        resp = requests.get(url, timeout=15)
        if resp.status_code == 200:
            with open(local_path, "wb") as f:
                f.write(resp.content)
            return local_path
        return None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Analysis Engine
# ---------------------------------------------------------------------------

def detect_speech_regions(y: np.ndarray, sr: int) -> list[tuple[float, float]]:
    """
    Detect distinct speech regions using librosa.effects.split.
    Returns list of (start_seconds, end_seconds) tuples.

    Per 10_CLINICAL_CONSTANTS.md: Use librosa.effects.split for silence detection.
    """
    # Split on silence — returns array of [start_sample, end_sample] intervals
    intervals = librosa.effects.split(
        y,
        top_db=abs(SILENCE_SPLIT_DB),  # librosa uses positive dB below peak
        frame_length=1024,
        hop_length=256,
    )

    regions = []
    for start_sample, end_sample in intervals:
        start_s = start_sample / sr
        end_s = end_sample / sr
        duration = end_s - start_s
        if duration >= 0.02:  # Ignore regions shorter than 20ms (clicks/artifacts)
            regions.append((round(start_s, 4), round(end_s, 4)))

    return regions


def merge_close_regions(
    regions: list[tuple[float, float]], min_gap: float
) -> list[tuple[float, float]]:
    """Merge speech regions that are closer together than min_gap."""
    if not regions:
        return []

    merged = [regions[0]]
    for start, end in regions[1:]:
        prev_start, prev_end = merged[-1]
        if start - prev_end < min_gap:
            merged[-1] = (prev_start, max(prev_end, end))
        else:
            merged.append((start, end))
    return merged


def analyze_file(filepath: str) -> dict:
    """
    Analyze a single audio file for carrier phrase contamination.

    Detection strategy:
      1. Load audio and measure total duration
      2. Find speech regions using librosa.effects.split
      3. Check for multiple speech bursts (carrier + word = 2 bursts)
      4. Measure onset timing and silence gaps
      5. Classify: CLEAN, CARRIER_PRESENT, CARRIER_REMNANT, ONSET_CLIP, TOO_SHORT, ERROR
    """
    result = {
        "duration_s": 0.0,
        "speech_regions": 0,
        "first_onset_s": 0.0,
        "word_onset_s": 0.0,
        "carrier_duration_s": 0.0,
        "silence_gap_s": 0.0,
        "rms_db": 0.0,
        "category": "ERROR",
        "confidence": 0.0,
        "notes": "",
    }

    try:
        # Load audio at 22050 Hz (standard for speech analysis)
        y, sr = librosa.load(filepath, sr=22050)
        duration = len(y) / sr
        result["duration_s"] = round(duration, 4)

        # RMS energy (overall)
        rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
        rms_db = 20 * np.log10(np.mean(rms) + 1e-10)
        result["rms_db"] = round(float(rms_db), 2)

        # --- Check 1: Duration-based screening ---
        if duration < CORRUPTED_MIN_DURATION_S:
            result["category"] = "TOO_SHORT"
            result["confidence"] = 1.0
            result["notes"] = f"Duration {duration:.3f}s < {CORRUPTED_MIN_DURATION_S}s minimum"
            return result

        # --- Check 2: Speech region detection ---
        raw_regions = detect_speech_regions(y, sr)
        merged_regions = merge_close_regions(raw_regions, MIN_SILENCE_GAP_S)
        result["speech_regions"] = len(merged_regions)

        if not merged_regions:
            result["category"] = "SILENCE"
            result["confidence"] = 1.0
            result["notes"] = "No speech detected"
            return result

        first_onset = merged_regions[0][0]
        result["first_onset_s"] = round(first_onset, 4)

        # --- Check 3: Multiple speech bursts = carrier phrase ---
        if len(merged_regions) >= 2:
            # Two or more distinct speech regions
            carrier_region = merged_regions[0]
            word_region = merged_regions[-1]  # Last region is likely the target word

            carrier_dur = carrier_region[1] - carrier_region[0]
            gap = word_region[0] - carrier_region[1]
            word_onset = word_region[0]

            result["carrier_duration_s"] = round(carrier_dur, 4)
            result["silence_gap_s"] = round(gap, 4)
            result["word_onset_s"] = round(word_onset, 4)

            # Strong indicator: first region >0.5s (carrier phrase) + gap + second region
            if carrier_dur > 0.4 and gap > 0.05:
                result["category"] = "CARRIER_PRESENT"
                result["confidence"] = 0.95
                result["notes"] = (
                    f"Multiple speech bursts detected. "
                    f"First region: {carrier_dur:.2f}s, gap: {gap:.2f}s, "
                    f"word onset: {word_onset:.2f}s. "
                    f"Likely carrier phrase + target word."
                )
                return result

            # Weaker indicator: any multi-burst pattern with total duration >1.3s
            if duration > CARRIER_PHRASE_DURATION_S:
                result["category"] = "CARRIER_LIKELY"
                result["confidence"] = 0.75
                result["notes"] = (
                    f"Multiple regions ({len(merged_regions)}) with total "
                    f"duration {duration:.2f}s > {CARRIER_PHRASE_DURATION_S}s threshold"
                )
                return result

        # --- Check 4: Long duration with single burst ---
        if duration > CARRIER_MIN_DURATION_S:
            result["word_onset_s"] = result["first_onset_s"]
            result["category"] = "CARRIER_LIKELY"
            result["confidence"] = 0.70
            result["notes"] = (
                f"Single speech region but duration {duration:.2f}s > "
                f"{CARRIER_MIN_DURATION_S}s threshold — carrier phrase may be "
                f"blended with word (no clear gap)"
            )
            return result

        # --- Check 5: Late onset (carrier phrase remnant) ---
        if first_onset > LATE_ONSET_THRESHOLD_S:
            result["word_onset_s"] = result["first_onset_s"]
            result["category"] = "LATE_ONSET"
            result["confidence"] = 0.50
            result["notes"] = (
                f"Speech starts at {first_onset:.3f}s — "
                f"possible carrier phrase remnant or excessive leading silence"
            )
            return result

        # --- Check 6: Clipped onset ---
        if first_onset < ONSET_CLIP_THRESHOLD_S and duration > 0.3:
            result["word_onset_s"] = 0.0
            result["category"] = "ONSET_CLIP"
            result["confidence"] = 0.40
            result["notes"] = (
                f"Speech starts at {first_onset:.4f}s — "
                f"may have clipped consonant attack (no leading silence)"
            )
            return result

        # --- Default: Clean ---
        result["word_onset_s"] = result["first_onset_s"]
        result["category"] = "CLEAN"
        result["confidence"] = 0.90
        result["notes"] = (
            f"Duration {duration:.2f}s, onset at {first_onset:.3f}s, "
            f"{len(merged_regions)} speech region(s)"
        )
        return result

    except Exception as e:
        result["category"] = "ERROR"
        result["notes"] = f"Analysis failed: {e}"
        return result


# ---------------------------------------------------------------------------
# Word List Loading
# ---------------------------------------------------------------------------

def load_word_list_from_csv() -> list[str]:
    """Load the full word list from CSV files."""
    import pandas as pd

    for csv_path in [WORDS_CSV, WORDS_CSV_ALT]:
        if os.path.exists(csv_path):
            try:
                df = pd.read_csv(csv_path)
                df.columns = [c.strip() for c in df.columns]

                words = set()
                # Try common column name patterns
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

    print("  Warning: No word CSV found. Using sample word list.")
    return SAMPLE_WORDS


# ---------------------------------------------------------------------------
# Main Audit Pipeline
# ---------------------------------------------------------------------------

def run_audit(
    voices: list[str],
    words: list[str],
    tmp_dir: str,
    max_concurrent: int = 5,
) -> tuple[list[dict], dict]:
    """
    Run the carrier phrase audit across voices and words.
    Returns (results_list, summary_dict).
    """
    total = len(voices) * len(words)
    results = []
    category_counts = {}
    voice_summaries = {}

    print(f"\n{'='*72}")
    print(f"  CARRIER PHRASE AUDIT — F-009")
    print(f"{'='*72}")
    print(f"  Voices:  {', '.join(voices)} ({len(voices)} voices)")
    print(f"  Words:   {len(words)} words")
    print(f"  Total:   {total} files to analyze")
    print(f"  Storage: {STORAGE_BASE}")
    print(f"{'='*72}\n")

    checked = 0
    start_time = time.time()

    for voice in voices:
        print(f"\n--- Voice: {voice} ---")
        voice_results = {}
        voice_durations = []
        voice_onsets = []

        for i, word in enumerate(words):
            checked += 1

            # Progress indicator every 20 files
            if i > 0 and i % 20 == 0:
                elapsed = time.time() - start_time
                rate = checked / elapsed if elapsed > 0 else 0
                eta = (total - checked) / rate if rate > 0 else 0
                print(f"  ... {i}/{len(words)} words checked "
                      f"({checked}/{total} total, ~{eta:.0f}s remaining)")

            filepath = download_file(voice, word, tmp_dir)

            if filepath is None:
                entry = {
                    "voice": voice,
                    "word": word,
                    "category": "MISSING",
                    "duration_s": 0,
                    "speech_regions": 0,
                    "first_onset_s": 0,
                    "word_onset_s": 0,
                    "carrier_duration_s": 0,
                    "silence_gap_s": 0,
                    "rms_db": 0,
                    "confidence": 1.0,
                    "notes": "File not found in storage (404)",
                }
                results.append(entry)
                voice_results["MISSING"] = voice_results.get("MISSING", 0) + 1
                category_counts["MISSING"] = category_counts.get("MISSING", 0) + 1
                continue

            analysis = analyze_file(filepath)
            cat = analysis["category"]

            entry = {
                "voice": voice,
                "word": word,
                **analysis,
            }
            results.append(entry)
            voice_results[cat] = voice_results.get(cat, 0) + 1
            category_counts[cat] = category_counts.get(cat, 0) + 1

            if analysis["duration_s"] > 0:
                voice_durations.append(analysis["duration_s"])
            if analysis["first_onset_s"] > 0:
                voice_onsets.append(analysis["first_onset_s"])

            # Print problematic files immediately
            if cat not in ("CLEAN", "MISSING"):
                indicator = {
                    "CARRIER_PRESENT": "!!",
                    "CARRIER_LIKELY": "!?",
                    "LATE_ONSET": "??",
                    "ONSET_CLIP": "~!",
                    "TOO_SHORT": "<<",
                    "SILENCE": "--",
                    "ERROR": "XX",
                }.get(cat, "??")
                print(
                    f"  {indicator} {word:15s} -> {cat:16s} "
                    f"dur={analysis['duration_s']:.2f}s "
                    f"onset={analysis['first_onset_s']:.3f}s "
                    f"regions={analysis['speech_regions']}"
                )

            # Clean up downloaded file to save disk
            try:
                os.remove(filepath)
            except OSError:
                pass

        # Per-voice summary
        total_voice = sum(voice_results.values())
        clean_voice = voice_results.get("CLEAN", 0)
        missing_voice = voice_results.get("MISSING", 0)
        tested_voice = total_voice - missing_voice
        contaminated = sum(
            v for k, v in voice_results.items()
            if k in ("CARRIER_PRESENT", "CARRIER_LIKELY")
        )

        print(f"\n  {voice} summary: "
              f"{clean_voice}/{tested_voice} clean "
              f"({clean_voice/tested_voice*100:.0f}% of found files)" if tested_voice > 0 else "")
        if contaminated > 0:
            print(f"    CARRIER CONTAMINATED: {contaminated} "
                  f"({contaminated/tested_voice*100:.1f}%)" if tested_voice > 0 else "")
        for cat in sorted(voice_results.keys()):
            count = voice_results[cat]
            if count > 0 and cat != "CLEAN":
                print(f"    {cat}: {count}")

        if voice_durations:
            print(f"    Duration: {np.min(voice_durations):.2f}s — "
                  f"{np.max(voice_durations):.2f}s "
                  f"(mean {np.mean(voice_durations):.2f}s)")
        if voice_onsets:
            print(f"    Onset:    {np.min(voice_onsets):.3f}s — "
                  f"{np.max(voice_onsets):.3f}s "
                  f"(mean {np.mean(voice_onsets):.3f}s)")

        voice_summaries[voice] = {
            "total": total_voice,
            "found": tested_voice,
            "missing": missing_voice,
            "clean": clean_voice,
            "contaminated": contaminated,
            "clean_pct": round(clean_voice / tested_voice * 100, 1) if tested_voice > 0 else 0,
            "contaminated_pct": round(contaminated / tested_voice * 100, 1) if tested_voice > 0 else 0,
            "duration_range": (
                f"{np.min(voice_durations):.2f}s — {np.max(voice_durations):.2f}s"
                if voice_durations else "N/A"
            ),
            "duration_mean": round(float(np.mean(voice_durations)), 3) if voice_durations else 0,
            "onset_mean": round(float(np.mean(voice_onsets)), 4) if voice_onsets else 0,
            "categories": dict(voice_results),
        }

    elapsed = time.time() - start_time

    summary = {
        "audit_date": datetime.now().isoformat(timespec="seconds"),
        "supabase_url": SUPABASE_URL,
        "voices_audited": voices,
        "words_audited": len(words),
        "total_files_checked": total,
        "elapsed_seconds": round(elapsed, 1),
        "category_totals": dict(sorted(category_counts.items(), key=lambda x: -x[1])),
        "voice_summaries": voice_summaries,
    }

    return results, summary


def print_overall_summary(results: list[dict], summary: dict):
    """Print the overall audit summary."""
    total = summary["total_files_checked"]
    cats = summary["category_totals"]

    # Count non-missing files
    found = total - cats.get("MISSING", 0)
    contaminated = cats.get("CARRIER_PRESENT", 0) + cats.get("CARRIER_LIKELY", 0)
    clean = cats.get("CLEAN", 0)
    other_issues = found - clean - contaminated

    print(f"\n{'='*72}")
    print(f"  OVERALL SUMMARY")
    print(f"{'='*72}")
    print(f"  Files checked:     {total}")
    print(f"  Files found:       {found}")
    print(f"  Files missing:     {cats.get('MISSING', 0)}")
    print(f"  Elapsed time:      {summary['elapsed_seconds']:.1f}s")
    print()

    for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
        if count > 0:
            pct = count / total * 100
            bar = "#" * int(pct / 2)
            print(f"  {cat:18s}  {count:5d} / {total}  ({pct:5.1f}%)  {bar}")

    print()
    if found > 0:
        print(f"  Clean:             {clean}/{found} ({clean/found*100:.1f}%)")
        print(f"  Carrier-contaminated: {contaminated}/{found} ({contaminated/found*100:.1f}%)")
        if other_issues > 0:
            print(f"  Other issues:      {other_issues}/{found} ({other_issues/found*100:.1f}%)")

    # Duration statistics
    durations = [r["duration_s"] for r in results if r["duration_s"] > 0]
    if durations:
        print(f"\n  Duration range:    {min(durations):.2f}s — {max(durations):.2f}s")
        print(f"  Duration mean:     {np.mean(durations):.3f}s")
        print(f"  Duration median:   {np.median(durations):.3f}s")
        print(f"  Duration std:      {np.std(durations):.3f}s")

    # Onset statistics
    onsets = [r["first_onset_s"] for r in results if r["first_onset_s"] > 0]
    if onsets:
        print(f"\n  Onset range:       {min(onsets):.4f}s — {max(onsets):.4f}s")
        print(f"  Onset mean:        {np.mean(onsets):.4f}s")

    # Per-voice comparison
    print(f"\n  --- Per-Voice Comparison ---")
    for voice, vs in summary["voice_summaries"].items():
        status = "OK" if vs["contaminated"] == 0 else "CONTAMINATED"
        print(
            f"  {voice:10s}  "
            f"clean={vs['clean_pct']:5.1f}%  "
            f"contaminated={vs['contaminated_pct']:5.1f}%  "
            f"dur={vs['duration_mean']:.2f}s  "
            f"onset={vs['onset_mean']:.3f}s  "
            f"[{status}]"
        )

    # Recommendation
    print(f"\n{'='*72}")
    print(f"  RECOMMENDATION")
    print(f"{'='*72}")
    if found == 0:
        print("  No files found. Check SUPABASE_URL and storage paths.")
    elif contaminated / found > 0.5:
        print("  CRITICAL: >50% carrier phrase contamination detected.")
        print("  Full regeneration of word audio is recommended.")
        print("  Use: python3 scripts/regen_clean_audio.py")
        print(f"  Estimated files to regenerate: ~{contaminated * len(ALL_VOICES) // len(summary['voices_audited'])}")
    elif contaminated / found > 0.1:
        print("  SIGNIFICANT: 10-50% contamination detected.")
        print("  Selective regeneration recommended for affected files.")
        print("  Flagged files exported to docs/carrier_phrase_flagged.csv")
    elif contaminated > 0:
        print("  MINOR: <10% contamination detected.")
        print("  Consider selective regeneration or runtime trimming.")
    else:
        print("  All audited files appear CLEAN.")
        if other_issues > 0:
            print(f"  Note: {other_issues} files have other quality issues "
                  f"(late onset, clipped onset, etc.)")


def save_reports(
    results: list[dict],
    summary: dict,
    output_dir: str,
):
    """Save JSON and CSV reports."""
    os.makedirs(output_dir, exist_ok=True)

    # JSON report
    json_path = os.path.join(output_dir, "carrier_phrase_audit.json")
    report = {
        **summary,
        "thresholds": {
            "carrier_min_duration_s": CARRIER_MIN_DURATION_S,
            "clean_max_duration_s": CLEAN_MAX_DURATION_S,
            "corrupted_min_duration_s": CORRUPTED_MIN_DURATION_S,
            "onset_clip_threshold_s": ONSET_CLIP_THRESHOLD_S,
            "late_onset_threshold_s": LATE_ONSET_THRESHOLD_S,
            "silence_split_db": SILENCE_SPLIT_DB,
            "min_silence_gap_s": MIN_SILENCE_GAP_S,
        },
        "results": results,
    }
    with open(json_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\n  JSON report: {json_path}")

    # CSV of flagged files only
    flagged = [
        r for r in results
        if r["category"] in (
            "CARRIER_PRESENT", "CARRIER_LIKELY", "LATE_ONSET",
            "ONSET_CLIP", "TOO_SHORT", "SILENCE", "ERROR"
        )
    ]
    if flagged:
        csv_path = os.path.join(output_dir, "carrier_phrase_flagged.csv")
        fieldnames = [
            "voice", "word", "category", "confidence", "duration_s",
            "speech_regions", "first_onset_s", "word_onset_s",
            "carrier_duration_s", "silence_gap_s", "rms_db", "notes",
        ]
        with open(csv_path, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in flagged:
                writer.writerow({k: r.get(k, "") for k in fieldnames})
        print(f"  Flagged CSV: {csv_path} ({len(flagged)} files)")
    else:
        print("  No flagged files — CSV not generated.")

    # Summary CSV for quick voice comparison
    summary_csv_path = os.path.join(output_dir, "carrier_phrase_voice_summary.csv")
    with open(summary_csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "voice", "total", "found", "missing", "clean", "contaminated",
            "clean_pct", "contaminated_pct", "duration_mean", "onset_mean",
        ])
        for voice, vs in summary["voice_summaries"].items():
            writer.writerow([
                voice, vs["total"], vs["found"], vs["missing"],
                vs["clean"], vs["contaminated"],
                vs["clean_pct"], vs["contaminated_pct"],
                vs["duration_mean"], vs["onset_mean"],
            ])
    print(f"  Voice summary: {summary_csv_path}")


# ---------------------------------------------------------------------------
# CLI Entry Point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Audit word audio files for carrier phrase contamination (F-009)"
    )
    parser.add_argument(
        "--full", action="store_true",
        help="Audit ALL words from CSV (slow — ~1,847 words x voices)",
    )
    parser.add_argument(
        "--voices", nargs="+", default=None,
        help=f"Voices to audit (default: all 9). Options: {', '.join(ALL_VOICES)}",
    )
    parser.add_argument(
        "--words", nargs="+", default=None,
        help="Specific words to audit (overrides --full and sample list)",
    )
    parser.add_argument(
        "--output-dir", default=None,
        help="Output directory for reports (default: docs/)",
    )
    args = parser.parse_args()

    if not HAS_LIBROSA:
        print("ERROR: librosa is required for audio analysis.")
        print("Install with: pip install librosa")
        sys.exit(1)

    # Determine voices
    voices = args.voices if args.voices else ALL_VOICES
    for v in voices:
        if v not in ALL_VOICES:
            print(f"WARNING: '{v}' is not in the clinical roster. Proceeding anyway.")

    # Determine word list
    if args.words:
        words = [w.lower() for w in args.words]
        print(f"  Using {len(words)} specified words")
    elif args.full:
        try:
            import pandas  # noqa: F401
            words = load_word_list_from_csv()
        except ImportError:
            print("WARNING: pandas required for --full mode. Using sample list.")
            words = SAMPLE_WORDS
    else:
        words = SAMPLE_WORDS
        print(f"  Using sample word list ({len(words)} words)")
        print(f"  Tip: Use --full for comprehensive audit")

    # Output directory
    output_dir = args.output_dir or os.path.join(
        os.path.dirname(__file__), "..", "docs"
    )

    # Run audit in temp directory
    with tempfile.TemporaryDirectory(prefix="soundsteps_audit_") as tmp_dir:
        results, summary = run_audit(voices, words, tmp_dir)

    # Print and save
    print_overall_summary(results, summary)
    save_reports(results, summary, output_dir)

    # Exit code: non-zero if contamination found
    contaminated = (
        summary["category_totals"].get("CARRIER_PRESENT", 0)
        + summary["category_totals"].get("CARRIER_LIKELY", 0)
    )
    sys.exit(1 if contaminated > 0 else 0)


if __name__ == "__main__":
    main()
