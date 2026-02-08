# Audio Regeneration Plan — F-009 Carrier Phrase Fix

> **Created:** 2026-02-07
> **Status:** READY FOR EXECUTION
> **Priority:** P0 (clinical validity)
> **Tracking:** F-009 in `docs/TESTING_FINDINGS.md`

---

## 1. Problem Statement

### What is the carrier phrase?

All word audio was originally generated using ElevenLabs with a carrier phrase to prevent cold-start clipping:

```
Input to TTS: "The next word is [TARGET]."
```

Per `docs/rules/00_MASTER_RULES.md` Section 5 ("The Carrier Phrase Rule"):
> All target stimuli must be generated within a padding sentence.
> Standard: "The next word is [TARGET]..."
> Reason: Establishes prosody/breath control before the target phoneme.

The original pipeline (`scripts/generate_assets_premier.py`) used ElevenLabs' `/with-timestamps` API to surgically crop the target word out of the carrier phrase using character-level timing alignment. This approach was correct in theory.

### Current State

The initial F-009 audit (`scripts/audit_audio_quality.py`, 2026-02-07) tested 60 files across 3 voices (sarah, alice, charlie) and found **zero carrier phrase contamination**. The previous audit concluded files were clean and downgraded F-009 from P0 to P3.

However, the original user report was specific and credible — hearing "is pond", "is food" with the British voice. The prior audit:
- Tested only 20 words across 3 voices (60 files out of ~20,000)
- Did not test all 9 voices
- Did not test Daniel voice (the one reported as problematic)
- Used a duration-only heuristic (>1.8s = carrier) which would miss partially-trimmed files

### Why This Matters (Clinical Impact)

If carrier phrases remain in any files:
- **Inflated accuracy:** The carrier phrase gives CI users extra processing time and contextual cues
- **Smart Coach miscalibration:** The staircase algorithm thinks users perform better than they do, advancing difficulty too quickly
- **SNR calculation errors:** Active speech duration includes carrier phrase, skewing signal-to-noise ratios
- **Detection exercise invalidated:** Users hear context before the word, defeating the purpose of sound detection training
- **Professional credibility:** Audiologists evaluating the app will immediately notice contaminated audio

---

## 2. Current Audio Inventory (Scope)

From `docs/AUDIO_MASTER_INVENTORY.md`:

| Content Type | Files | Carrier Phrase Risk | Action |
|-------------|-------|-------------------|--------|
| **Word Pairs** | 20,301 | **HIGH** — generated with carrier phrase pipeline | Audit + selective regen |
| Sentences v1 | 5,659 | LOW — sentences are spoken in full | No action |
| Sentences v2 | 2,790 | LOW — same as v1 | No action |
| Stories | 440 | NONE — full passages | No action |
| Conversations | 1,400 | NONE — full Q&A pairs | No action |
| Phoneme Drills | 3,600 | **MEDIUM** — word-level audio, check generation method | Audit |
| Rate Variants | 1,800 | LOW — sentence/phrase level | No action |
| Environmental | 50 | NONE — sound effects | No action |
| Noise Assets | 8 | NONE — background noise | No action |

**Primary target:** 20,301 word pair files across 9 voices.

### Word Pair Coverage per Voice

| Voice | Files | ElevenLabs ID | Region |
|-------|-------|---------------|--------|
| sarah | 1,847 | EXAVITQu4vr4xnSDxMaL | US |
| emma | 1,847 | OYTbf65OHHFELVut7v2H | US |
| bill | 1,845 | pqHfZKP75CvOlQylNhV4 | US |
| michael | 1,846 | flq6f7yk4E4fJM5XTYuZ | US |
| alice | 1,843 | Xb7hH8MSUJpSbSDYk0k2 | UK |
| daniel | 1,845 | onwK4e9ZLuTAKqWW03F9 | UK |
| matilda | 1,845 | XrExE9yKIg1WjnnlVkGX | AU |
| charlie | 1,844 | IKne3meq5aSn9XLyUdCD | AU |
| aravind | 1,847 | 5Q0t7uMcjvnagumLfvZi | IN |

---

## 3. Detection Pipeline

### Script: `scripts/audit_carrier_phrases.py`

Enhanced audit script with multi-layered detection:

| Detection Method | What It Catches | Confidence |
|-----------------|----------------|------------|
| Duration analysis | Full carrier phrase intact (>1.5s) | 95% |
| Multi-onset detection | Two speech bursts (carrier + word) | 95% |
| Silence gap analysis | Characteristic pause between carrier and word | 90% |
| Late onset detection | Carrier phrase remnant (speech starts >300ms) | 50% |
| Onset clipping | Missing consonant attack (<5ms onset) | 40% |

### Running the Audit

```bash
# Quick sample audit (40 words x 9 voices = 360 files, ~5 min)
python3 scripts/audit_carrier_phrases.py

# Full audit (1,847 words x 9 voices = ~16,600 files, ~30 min)
python3 scripts/audit_carrier_phrases.py --full

# Target specific voices
python3 scripts/audit_carrier_phrases.py --voices daniel alice

# Test specific words (e.g., user-reported problems)
python3 scripts/audit_carrier_phrases.py --words pond food bear rival rack
```

### Output Files

| File | Purpose |
|------|---------|
| `docs/carrier_phrase_audit.json` | Full results with per-file analysis |
| `docs/carrier_phrase_flagged.csv` | Only problematic files (input for regen) |
| `docs/carrier_phrase_voice_summary.csv` | Per-voice contamination rates |

---

## 4. Decision: Trim vs. Regenerate

### Option A: Trim Existing Files

**Process:** Download -> detect carrier phrase boundary -> cut -> re-upload

| Pro | Con |
|-----|-----|
| Fast (~1 hour for full set) | Artifacts at cut point (click/pop) |
| No API credits consumed | Prosodic mismatch (word was spoken IN context of carrier) |
| Preserves exact same voice | Boundary detection may be imprecise |
| Reversible (originals in storage) | Some files may be too tightly coupled |

**Trimming spec (from `10_CLINICAL_CONSTANTS.md`):**
- Pre-Trim: ~1.3 seconds
- Silence Detection: `librosa.effects.split`
- Safety Margin: 50ms at start/end
- Min Duration Flag: <0.3s = corrupted

### Option B: Regenerate Clean (RECOMMENDED)

**Process:** Generate new TTS without carrier phrase -> trim silence -> normalize -> verify -> upload

| Pro | Con |
|-----|-----|
| Clean audio, no artifacts | Costs ElevenLabs credits |
| Word spoken in isolation (natural) | Takes longer (~2-4 hours) |
| Consistent quality across all files | Slight voice variation from originals |
| Can verify before upload | Requires API key |
| Built-in quality gate | |

**Generation method:** Use text padding ("... {word} ...") instead of carrier phrase. This gives the TTS model prosodic context without producing audible carrier content. Post-generation silence trimming removes the padding.

### Recommendation: Option B (Regenerate)

The carrier phrase fundamentally changes how ElevenLabs renders the word — the word is spoken as part of a sentence, with sentence-level prosody. Trimming removes the carrier audio but the remaining word still has "sentence word" prosody rather than "isolated word" prosody. For clinical accuracy, regeneration is cleaner.

With 500K credits available and ~200K needed for full regeneration, credits are not a constraint.

---

## 5. Regeneration Pipeline

### Script: `scripts/regen_clean_audio.py`

```
Input: word list + voice roster
  |
  v
[1] Generate TTS (ElevenLabs API, no carrier phrase)
  |  Text: "... {word} ..."
  |  Model: eleven_turbo_v2_5
  |  Settings: stability=0.5, similarity_boost=0.75
  |
  v
[2] Trim Silence (ffmpeg silenceremove)
  |  Remove leading/trailing silence
  |  Threshold: -45dB
  |
  v
[3] Add Safety Padding (ffmpeg adelay/apad)
  |  50ms silence at start and end
  |  Prevents clipped consonant attacks
  |
  v
[4] Normalize Loudness (ffmpeg loudnorm, 2-pass)
  |  Target: -20 LUFS
  |  Peak: -1.0 dB TP
  |  Sample Rate: 44100 Hz
  |  Format: MP3 128kbps
  |
  v
[5] Verify (librosa analysis)
  |  Duration: 0.3s - 3.0s
  |  Speech regions: 1-2 (no multi-burst)
  |  RMS: above silence threshold
  |
  v
[6] Upload (Supabase Storage, upsert)
     Path: audio/words_v2/{voice}/{word}.mp3
     Overwrites existing file
```

### Running the Regeneration

```bash
# Step 1: Dry run — see what would be regenerated (no API calls)
python3 scripts/regen_clean_audio.py --dry-run --full

# Step 2: Test with a few words on one voice
python3 scripts/regen_clean_audio.py --execute --voices sarah --words bat cat dog

# Step 3: Verify the test files in the browser
# Visit: https://padfntxzoxhozfjsqnzc.supabase.co/storage/v1/object/public/audio/words_v2/sarah/bat.mp3

# Step 4: Regenerate flagged files only (from audit)
python3 scripts/regen_clean_audio.py --execute --from-flagged docs/carrier_phrase_flagged.csv

# Step 5: Full regeneration (all voices, all words)
python3 scripts/regen_clean_audio.py --execute --full

# If interrupted, resume from checkpoint
python3 scripts/regen_clean_audio.py --execute --full --resume
```

### Safety Features

| Feature | Purpose |
|---------|---------|
| Dry run by default | Must explicitly pass `--execute` |
| Checkpoint file | Saves progress every 10 files; safe to interrupt |
| Verification gate | Rejects files that fail quality checks before upload |
| Upsert upload | Overwrites existing files (originals not deleted from Supabase) |
| Rate limiting | 250ms between API calls, 2s pause every 20 files |
| Per-file logging | Every success/failure logged to console and checkpoint |

---

## 6. Credit Cost Estimate

| Scenario | Files | Est. Credits | Notes |
|----------|-------|-------------|-------|
| Flagged files only | ~2,000-16,000 | 20K-160K | Depends on audit results |
| Full word regeneration (all 9 voices) | ~16,600 | ~166K | Conservative estimate |
| Full word regen + phoneme drills | ~20,200 | ~202K | If drills also need regen |
| **Budget available** | — | **500,000** | Plenty of headroom |

**Credit calculation:** ElevenLabs charges approximately 10 credits per short text generation (single word with padding). Actual cost depends on model and text length.

---

## 7. Rollback Plan

### If regenerated audio has issues:

1. **Supabase Storage retains versions** — files uploaded with upsert overwrite the public path but Supabase does not permanently delete the previous version immediately
2. **Checkpoint file** (`docs/regen_checkpoint.json`) records exactly which files were regenerated and when
3. **Original generation scripts** (`scripts/generate_assets_premier.py`) can recreate the carrier-phrase versions if needed
4. **Nuclear option:** Restore from the most recent Supabase Storage backup

### Verification before rollout:

1. Run the audit script against regenerated files to confirm zero carrier contamination
2. Spot-check 10 files per voice in a browser audio player
3. Have the developer (CI user) listen to a sample across voices
4. Check file sizes — regenerated files should be ~30-50% smaller (no carrier phrase content)

---

## 8. Execution Timeline

### Phase 1: Comprehensive Audit (1-2 hours)

1. Run full audit: `python3 scripts/audit_carrier_phrases.py --full`
2. Review `docs/carrier_phrase_audit.json` for contamination rate
3. If contamination > 10%: proceed to Phase 2
4. If contamination < 10%: evaluate selective regen vs. runtime offset

### Phase 2: Test Regeneration (30 minutes)

1. Regenerate 5 words x 3 voices (15 files): `--execute --voices sarah daniel charlie --words bat cat dog pond food`
2. Listen to all 15 files in browser
3. Compare quality to originals
4. Verify upload paths are correct

### Phase 3: Selective or Full Regeneration (2-4 hours)

**If audit shows selective contamination:**
```bash
python3 scripts/regen_clean_audio.py --execute --from-flagged docs/carrier_phrase_flagged.csv
```

**If audit shows widespread contamination (>50%):**
```bash
python3 scripts/regen_clean_audio.py --execute --full
```

### Phase 4: Post-Regeneration Verification (1 hour)

1. Re-run audit: `python3 scripts/audit_carrier_phrases.py --full`
2. Confirm 0% contamination
3. Spot-check audio quality across voices
4. Update `docs/TESTING_FINDINGS.md` F-009 status
5. Update `STATUS.md`

### Total estimated time: 4-8 hours

---

## 9. Dependencies

### Required Python packages

```bash
pip install librosa numpy requests soundfile
```

| Package | Version | Purpose |
|---------|---------|---------|
| librosa | 0.11.0 | Speech onset detection, silence splitting |
| numpy | 2.3.5 | Numerical analysis |
| requests | 2.32.5 | HTTP client for Supabase/ElevenLabs |
| soundfile | 0.13.1 | Audio file I/O |
| pandas | (any) | CSV word list loading (--full mode only) |

### Required system tools

| Tool | Purpose |
|------|---------|
| ffmpeg | Audio trimming, normalization, format conversion |
| python3 | Script runtime |

### Required credentials (in `.env`)

```
ELEVENLABS_API_KEY=...     # For TTS generation
SUPABASE_URL=...           # For storage access
SUPABASE_SERVICE_ROLE_KEY=...  # For upload (write access)
```

---

## 10. Files Reference

| File | Purpose |
|------|---------|
| `scripts/audit_carrier_phrases.py` | Detection script (Phase 1) |
| `scripts/regen_clean_audio.py` | Regeneration script (Phase 3) |
| `scripts/audit_audio_quality.py` | Original audit script (simpler, for reference) |
| `docs/carrier_phrase_audit.json` | Audit results (generated) |
| `docs/carrier_phrase_flagged.csv` | Flagged files list (generated) |
| `docs/carrier_phrase_voice_summary.csv` | Per-voice summary (generated) |
| `docs/regen_checkpoint.json` | Regeneration progress checkpoint (generated) |
| `docs/rules/10_CLINICAL_CONSTANTS.md` | Trimming spec reference |
| `docs/rules/00_MASTER_RULES.md` | Carrier phrase rule reference |
| `docs/VOICE_LIBRARY.md` | Voice IDs and generation settings |
| `docs/AUDIO_MASTER_INVENTORY.md` | File counts and storage paths |

---

## Appendix A: Why the Original Pipeline Has This Problem

The original pipeline (`scripts/generate_assets_premier.py`) used:

```python
carrier = "The word is"
text_input = f"{carrier} {word}."
```

It then used ElevenLabs' `/with-timestamps` endpoint to get character-level timing, located the target word in the aligned output, and used ffmpeg to crop just the word portion. This is the correct approach per `00_MASTER_RULES.md`.

The cropping logic uses `rfind` to locate the target word characters in the alignment:

```python
start_idx = full_aligned_text.rfind(clean_target)
```

Potential failure modes:
1. **Alignment API returns inaccurate timestamps** — word boundaries off by 50-200ms
2. **`rfind` matches a substring** — "at" in "cat" or "is" in compound words
3. **Prosodic bleed** — even with perfect cropping, the word has sentence prosody
4. **ffmpeg `-c copy`** — copy mode cannot cut at arbitrary positions in compressed audio; it snaps to the nearest keyframe, potentially including carrier audio

The new pipeline avoids all of these by generating the word without a carrier phrase at all.

## Appendix B: Phoneme Drill Audio

Phoneme drills (`audio/drills/{voice}/{pack_id}/`) contain 3,600 word-level audio files. These should also be audited for carrier phrase contamination using the same pipeline. The audit script can be adapted:

```bash
# Future: extend audit to drill audio paths
# Drills use different storage path: audio/drills/{voice}/{pack_id}/{word}.mp3
```

This is a separate task from the word pairs regeneration and should be tracked independently.
