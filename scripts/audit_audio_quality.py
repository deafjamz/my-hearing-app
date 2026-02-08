#!/usr/bin/env python3
"""
Audio Quality Audit — F-009 Carrier Phrase Detection

Downloads a sample of word audio files from Supabase Storage and analyzes
them for carrier phrase contamination ("The word is ___").

Checks:
1. Total file duration (carrier phrase files are ~2-3s, clean words are ~0.5-1.5s)
2. Speech onset detection (where does the target word actually start?)
3. Categorizes each file: CLEAN / CARRIER_BLEED / ONSET_CLIP / SHORT / ERROR

Usage:
    python3 scripts/audit_audio_quality.py
"""

import os
import sys
import json
import tempfile
import requests
import numpy as np
from pathlib import Path

# Try to use librosa for onset detection
try:
    import librosa
    HAS_LIBROSA = True
except ImportError:
    HAS_LIBROSA = False
    print("WARNING: librosa not found. Duration-only analysis.")

# Configuration
SUPABASE_URL = "https://padfntxzoxhozfjsqnzc.supabase.co"
STORAGE_BASE = f"{SUPABASE_URL}/storage/v1/object/public/audio/words_v2"

# Voices to audit (one from each region: US, UK, AU)
VOICES = ["sarah", "alice", "charlie"]

# Representative word sample — mix of short/long, common/uncommon
WORDS = [
    "bat", "cat", "dog", "food", "pond",
    "chair", "cheese", "house", "phone", "train",
    "apple", "basket", "finger", "garden", "market",
    "river", "silver", "water", "yellow", "bottle",
]

# Thresholds
CARRIER_PHRASE_MIN_DURATION = 1.8  # Files longer than this likely have carrier phrase
CLEAN_MAX_DURATION = 1.6           # Files shorter than this are likely clean words
ONSET_TOO_EARLY = 0.1              # If speech starts before 100ms, might be clipped


def download_file(voice: str, word: str, tmp_dir: str) -> str | None:
    """Download an audio file from Supabase Storage. Returns local path or None."""
    normalized = word.lower().replace(" ", "_")
    url = f"{STORAGE_BASE}/{voice}/{normalized}.mp3"
    local_path = os.path.join(tmp_dir, f"{voice}_{normalized}.mp3")

    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            with open(local_path, "wb") as f:
                f.write(resp.content)
            return local_path
        else:
            return None
    except Exception as e:
        print(f"  ERROR downloading {voice}/{normalized}: {e}")
        return None


def analyze_file(filepath: str) -> dict:
    """Analyze a single audio file for carrier phrase contamination."""
    result = {
        "duration_s": 0,
        "onset_s": 0,
        "rms_before_onset": 0,
        "category": "ERROR",
        "notes": "",
    }

    try:
        # Load with librosa
        y, sr = librosa.load(filepath, sr=22050)
        duration = len(y) / sr
        result["duration_s"] = round(duration, 3)

        # Onset detection — find where significant audio energy begins
        # Use RMS energy in short frames
        frame_length = 1024
        hop_length = 256
        rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]

        # Find first frame where RMS exceeds threshold (speech onset)
        threshold = np.max(rms) * 0.1  # 10% of peak energy
        onset_frame = 0
        for i, val in enumerate(rms):
            if val > threshold:
                onset_frame = i
                break

        onset_time = onset_frame * hop_length / sr
        result["onset_s"] = round(onset_time, 3)

        # RMS energy before onset (should be near-zero for clean files)
        if onset_frame > 0:
            result["rms_before_onset"] = round(float(np.mean(rms[:onset_frame])), 6)

        # Categorize
        if duration > CARRIER_PHRASE_MIN_DURATION:
            result["category"] = "CARRIER_BLEED"
            result["notes"] = f"Long duration ({duration:.1f}s) suggests carrier phrase present"
        elif duration < 0.3:
            result["category"] = "TOO_SHORT"
            result["notes"] = f"Suspiciously short ({duration:.1f}s)"
        elif onset_time < ONSET_TOO_EARLY and duration > 0.5:
            result["category"] = "POSSIBLE_CLIP"
            result["notes"] = f"Speech starts immediately ({onset_time:.3f}s) — may have onset clipped"
        elif onset_time > 0.8:
            result["category"] = "LATE_ONSET"
            result["notes"] = f"Speech doesn't start until {onset_time:.1f}s — carrier phrase remnant?"
        else:
            result["category"] = "CLEAN"
            result["notes"] = f"Duration {duration:.1f}s, onset at {onset_time:.3f}s"

    except Exception as e:
        result["category"] = "ERROR"
        result["notes"] = str(e)

    return result


def main():
    print("=" * 70)
    print("AUDIO QUALITY AUDIT — F-009 Carrier Phrase Detection")
    print("=" * 70)
    print(f"Voices: {', '.join(VOICES)}")
    print(f"Words:  {len(WORDS)} sample words")
    print(f"Total files to check: {len(VOICES) * len(WORDS)}")
    print()

    if not HAS_LIBROSA:
        print("ERROR: librosa required for analysis. Install with: pip install librosa")
        sys.exit(1)

    results = []
    category_counts = {"CLEAN": 0, "CARRIER_BLEED": 0, "POSSIBLE_CLIP": 0, "LATE_ONSET": 0, "TOO_SHORT": 0, "ERROR": 0, "MISSING": 0}

    with tempfile.TemporaryDirectory() as tmp_dir:
        for voice in VOICES:
            print(f"\n--- Voice: {voice} ---")
            voice_results = {"CLEAN": 0, "CARRIER_BLEED": 0, "POSSIBLE_CLIP": 0, "LATE_ONSET": 0, "TOO_SHORT": 0, "ERROR": 0, "MISSING": 0}

            for word in WORDS:
                filepath = download_file(voice, word, tmp_dir)
                if not filepath:
                    print(f"  {word:15s} → MISSING (404)")
                    category_counts["MISSING"] += 1
                    voice_results["MISSING"] += 1
                    results.append({"voice": voice, "word": word, "category": "MISSING", "duration_s": 0, "onset_s": 0, "notes": "File not found in storage"})
                    continue

                analysis = analyze_file(filepath)
                cat = analysis["category"]
                category_counts[cat] += 1
                voice_results[cat] += 1

                indicator = "✓" if cat == "CLEAN" else "✗" if cat in ("CARRIER_BLEED", "ERROR") else "?"
                print(f"  {indicator} {word:15s} → {cat:15s}  dur={analysis['duration_s']:.1f}s  onset={analysis['onset_s']:.3f}s  {analysis['notes']}")

                results.append({
                    "voice": voice,
                    "word": word,
                    "category": cat,
                    "duration_s": analysis["duration_s"],
                    "onset_s": analysis["onset_s"],
                    "rms_before_onset": analysis.get("rms_before_onset", 0),
                    "notes": analysis["notes"],
                })

            # Per-voice summary
            total_voice = len(WORDS)
            clean_voice = voice_results["CLEAN"]
            print(f"\n  {voice} summary: {clean_voice}/{total_voice} clean ({clean_voice/total_voice*100:.0f}%)")
            for cat, count in voice_results.items():
                if count > 0 and cat != "CLEAN":
                    print(f"    {cat}: {count}")

    # Overall summary
    total = len(VOICES) * len(WORDS)
    print("\n" + "=" * 70)
    print("OVERALL SUMMARY")
    print("=" * 70)
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        if count > 0:
            pct = count / total * 100
            bar = "█" * int(pct / 2)
            print(f"  {cat:15s}  {count:3d} / {total}  ({pct:5.1f}%)  {bar}")

    clean_total = category_counts["CLEAN"]
    problem_total = total - clean_total - category_counts.get("MISSING", 0)
    print(f"\n  Clean: {clean_total}/{total} ({clean_total/total*100:.0f}%)")
    print(f"  Problematic: {problem_total}/{total} ({problem_total/total*100:.0f}%)")

    # Duration stats
    durations = [r["duration_s"] for r in results if r["duration_s"] > 0]
    if durations:
        print(f"\n  Duration range: {min(durations):.1f}s — {max(durations):.1f}s")
        print(f"  Duration mean:  {np.mean(durations):.2f}s")
        print(f"  Duration median: {np.median(durations):.2f}s")

    # Onset stats
    onsets = [r["onset_s"] for r in results if r["onset_s"] > 0]
    if onsets:
        print(f"\n  Onset range: {min(onsets):.3f}s — {max(onsets):.3f}s")
        print(f"  Onset mean:  {np.mean(onsets):.3f}s")

    # Save detailed results
    output_path = os.path.join(os.path.dirname(__file__), "..", "docs", "audio_audit_results.json")
    with open(output_path, "w") as f:
        json.dump({
            "audit_date": "2026-02-07",
            "voices": VOICES,
            "words": WORDS,
            "total_files": total,
            "summary": dict(category_counts),
            "results": results,
        }, f, indent=2)
    print(f"\nDetailed results saved to: {output_path}")

    # Recommendation
    print("\n" + "=" * 70)
    print("RECOMMENDATION")
    print("=" * 70)
    if problem_total / total > 0.5:
        print("  CRITICAL: >50% of files have issues. Full regeneration recommended.")
        print("  In the meantime, identify the cleanest voice and default to it.")
    elif problem_total / total > 0.2:
        print("  SIGNIFICANT: 20-50% of files have issues.")
        print("  Consider per-file offset mapping or selective regeneration.")
    else:
        print("  MINOR: <20% of files have issues.")
        print("  A fixed offset skip may be sufficient for most files.")

    # Find cleanest voice
    voice_clean_pcts = {}
    for voice in VOICES:
        voice_files = [r for r in results if r["voice"] == voice and r["category"] != "MISSING"]
        if voice_files:
            clean = sum(1 for r in voice_files if r["category"] == "CLEAN")
            voice_clean_pcts[voice] = clean / len(voice_files) * 100

    if voice_clean_pcts:
        best_voice = max(voice_clean_pcts, key=voice_clean_pcts.get)
        print(f"\n  Cleanest voice: {best_voice} ({voice_clean_pcts[best_voice]:.0f}% clean)")
        for v, pct in sorted(voice_clean_pcts.items(), key=lambda x: -x[1]):
            print(f"    {v}: {pct:.0f}% clean")


if __name__ == "__main__":
    main()
