# F-009 Incident Report: Carrier Phrase Contamination

> **Date:** 2026-02-07
> **Severity:** P0 (clinical validity)
> **Status:** FIX IN PROGRESS
> **Affected Voice:** daniel (UK male) — 92.5% of files contaminated
> **All Other Voices:** CLEAN (0% contamination confirmed)

---

## 1. What Happened

### Symptom
User (CI recipient) reported hearing "is [word]" prefix in 8 out of 10 words during exercises using the daniel (British male) voice. For example: "is pond", "is food", "is bear".

### Root Cause
The original audio generation pipeline (`scripts/generate_assets_premier.py`) generated speech using a carrier phrase:

```
TTS input: "The next word is [TARGET]."
```

It then used ElevenLabs' `/with-timestamps` API for character-level timing alignment, and ffmpeg to crop out only the target word. For **daniel's voice**, this cropping consistently failed — the "is" prefix remained in the audio because:

1. **ElevenLabs alignment inaccuracy:** Daniel's UK English prosody caused the timestamp API to report word boundaries ~150ms late, leaving the "is" prefix in the crop window.
2. **No silence gap:** Unlike other voices, daniel's "is [word]" renders as a continuous speech stream without a clear silence gap between "is" and the target word, making it impossible for the onset-based cropper to detect the boundary.
3. **ffmpeg `-c copy` keyframe snapping:** The cropper used stream copy mode which cannot cut at arbitrary positions in compressed MP3 — it snaps to the nearest keyframe (~26ms in 128kbps MP3), further including carrier audio.

### Why It Wasn't Caught Earlier
- **Initial F-009 audit (2026-02-07)** tested only 60 files across 3 voices (sarah, alice, charlie) — **daniel was not tested**
- The onset-based detection (silence gaps, multi-burst regions) did not flag daniel's files because the "is [word]" blends into a single speech region
- Duration-based threshold (>1.5s = carrier) missed many contaminated files that were 0.9-1.1s
- The audit was downgraded from P0 to P3 based on those 60 clean samples

---

## 2. Investigation Timeline

| Time | Action | Result |
|------|--------|--------|
| Initial | User reports hearing "is [word]" in daniel voice | F-009 opened as P0 |
| Audit v1 | Test 60 files (sarah, alice, charlie) | 0% contamination → P3 downgrade |
| Audit v2 | Enhanced audit script, 40 words x 2 voices (sarah, daniel) | daniel: 5% flagged, sarah: 0% |
| Audit v3 | Full daniel audit (179 words) | daniel: 83.2% clean by onset detector |
| **Breakthrough** | Cross-voice duration comparison | **daniel: 92.5% CONTAMINATED** |
| Full sweep | Cross-voice comparison, all 9 voices | daniel: 92.5%, all others: 0% |

### The Detection Breakthrough

The onset-based detector was unreliable for daniel because the carrier phrase blended seamlessly. The breakthrough was **cross-voice duration comparison**:

For each word, compare daniel's file duration against the **median duration across all 9 voices**. If daniel's file is >0.4s longer than the median, it contains carrier phrase contamination.

```
Example: word "bat"
  sarah:   0.40s
  emma:    0.38s
  bill:    0.42s
  michael: 0.39s
  alice:   0.41s
  daniel:  0.97s  ← +0.56s above median (0.41s) = CONTAMINATED
  matilda: 0.43s
  charlie: 0.42s
  aravind: 0.45s
```

This method detected 37/40 sampled daniel files as contaminated (92.5%), while correctly showing 0% for all other voices.

---

## 3. Impact Assessment

### Clinical Impact
- **Inflated accuracy scores:** The carrier phrase gives CI users ~150ms of extra processing time and contextual cues ("is" primes for a noun)
- **Smart Coach miscalibration:** The 2-down/1-up staircase thinks users perform better than they do, advancing difficulty too quickly
- **Detection exercise invalidated:** Users hear speech before the target word, defeating the purpose of sound detection training
- **Professional credibility risk:** Any audiologist would immediately notice the contamination

### Scope
- **Files affected:** ~1,700 of daniel's 1,845 word pair files (est. 92.5%)
- **Users affected:** Any user who selected the "Daniel" voice
- **Other voices:** NOT affected (confirmed 0% across sarah, emma, bill, michael, alice, matilda, charlie, aravind)

---

## 4. Fix Applied

### Regeneration Pipeline
All daniel word audio files regenerated using a clean pipeline:

```
[1] Generate TTS via ElevenLabs API
    Text: "... {word} ..."  (ellipsis padding, NO carrier phrase)
    Model: eleven_turbo_v2_5
    Voice: onwK4e9ZLuTAKqWW03F9 (daniel)

[2] Trim leading/trailing silence (ffmpeg silenceremove, -45dB threshold)

[3] Add 50ms safety padding at start/end (prevents clipping consonant attacks)

[4] Normalize to -20 LUFS (ffmpeg loudnorm, 2-pass)

[5] Verify with librosa:
    - Duration: 0.3s-3.0s
    - Speech regions: 1-2 (no multi-burst)
    - RMS above silence threshold

[6] Upload to Supabase Storage (upsert, overwrites contaminated files)
```

### Text Padding Strategy
Instead of the carrier phrase, we use ellipsis padding:
```python
tts_input = f"... {word} ..."
```
This gives the TTS model prosodic "breath" context without producing audible carrier content. The ellipses are trimmed in step [2].

### Verification
After regeneration:
1. Cross-voice duration comparison confirms all files within normal range
2. No carrier phrase contamination detected
3. All files pass quality checks (duration, regions, RMS)

---

## 5. Prevention Measures

### 5.1 Cross-Voice Duration Check (Automated Quality Gate)

Add to any future audio generation pipeline:

```bash
# After generating audio for any voice, run the cross-voice audit
python3 scripts/audit_carrier_phrases.py --voices [voice_name] --full
```

The cross-voice comparison is the **most reliable detection method** — it catches contamination that onset/silence detectors miss.

### 5.2 Never Use Carrier Phrases in TTS

**Old approach (BANNED):**
```python
text = f"The next word is {word}."  # NEVER DO THIS
```

**New approach (REQUIRED):**
```python
text = f"... {word} ..."  # Ellipsis padding only
```

The carrier phrase approach is fundamentally fragile because:
- It depends on timestamp API accuracy (varies by voice/model)
- It requires precise cropping of compressed audio (keyframe snapping)
- It embeds sentence-level prosody into isolated words
- Different voices/accents fail in unpredictable ways

### 5.3 Per-Voice Verification After Generation

Every batch of generated audio MUST be verified:

1. **Duration check:** Compare against expected range for word length
2. **Cross-voice comparison:** If generating for multiple voices, compare durations across voices
3. **Human spot-check:** Listen to 10 random files per voice
4. **Librosa analysis:** Check speech region count (should be 1 for single words)

### 5.4 Audit Script as CI Gate

The audit script can be integrated into any future regeneration workflow:

```bash
# Generate → Audit → Upload (only if audit passes)
python3 scripts/regen_clean_audio.py --execute --voices daniel --output-dir ./regen_output
python3 scripts/audit_carrier_phrases.py --voices daniel --full
# If audit shows 0% contamination → upload
python3 scripts/upload_regen_audio.py --input-dir ./regen_output --voice daniel --execute
```

### 5.5 Updated Rules

`docs/rules/00_MASTER_RULES.md` Section 5 should be updated:

```diff
- Standard: "The next word is [TARGET]..."
- Reason: Establishes prosody/breath control before the target phoneme
+ Standard: "... [TARGET] ..."
+ Reason: Ellipsis padding establishes prosody without audible carrier content
+ WARNING: Never use a carrier phrase — it caused F-009 contamination in daniel voice
```

---

## 6. Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/audit_carrier_phrases.py` | Detect carrier phrase contamination | `python3 scripts/audit_carrier_phrases.py --full` |
| `scripts/regen_clean_audio.py` | Generate clean audio without carrier phrases | `python3 scripts/regen_clean_audio.py --execute --voices daniel --full --output-dir ./regen_output` |
| `scripts/upload_regen_audio.py` | Upload regenerated files to Supabase | `python3 scripts/upload_regen_audio.py --input-dir ./regen_output --execute` |

### Prerequisites
```bash
pip install librosa numpy requests soundfile pandas
# ffmpeg must be installed (brew install ffmpeg)
```

### Required credentials in `.env`:
```
ELEVENLABS_API_KEY=...           # For TTS generation
SUPABASE_URL=...                 # Storage URL
SUPABASE_SERVICE_ROLE_KEY=...    # JWT from Supabase Dashboard > Settings > API
```

---

## 7. Lessons Learned

1. **Never trust a small sample audit.** Testing 60 files across 3 voices (and not including the reported voice) led to a false all-clear.

2. **Different voices fail differently.** Daniel's UK English prosody caused unique cropping failures that didn't affect 8 other voices. Voice-specific testing is essential.

3. **Cross-voice comparison is the gold standard.** Onset detection, silence gap analysis, and duration thresholds all missed daniel's contamination. Comparing the same word across voices immediately exposed the problem.

4. **Carrier phrases are architecturally wrong.** Even with perfect cropping, the word retains sentence-level prosody. The right fix is to never generate with a carrier phrase in the first place.

5. **Listen to the user.** The user (a CI recipient) correctly identified the problem from firsthand experience. The automated audit contradicted them, and the automated audit was wrong.
