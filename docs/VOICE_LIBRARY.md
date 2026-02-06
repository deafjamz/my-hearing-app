# Voice Library - Clinical Voice System

> **Last Updated:** 2026-01-19
> **Status:** 9-Voice Roster COMPLETE - All voices at 100% word coverage
> **ElevenLabs Model:** `eleven_turbo_v2_5`

---

## Quick Reference

| Voice | Region | Gender | ElevenLabs ID | HNR | Status |
|-------|--------|--------|---------------|-----|--------|
| Sarah | US | Female | `EXAVITQu4vr4xnSDxMaL` | 13.7 dB | Active |
| Emma | US | Female | `OYTbf65OHHFELVut7v2H` | 12.1 dB | Active |
| Bill | US | Male | `pqHfZKP75CvOlQylNhV4` | 11.4 dB | Active |
| Michael | US | Male | `flq6f7yk4E4fJM5XTYuZ` | 12.4 dB | Active |
| Alice | UK | Female | `Xb7hH8MSUJpSbSDYk0k2` | 11.2 dB | Active |
| Daniel | UK | Male | `onwK4e9ZLuTAKqWW03F9` | 12.1 dB | Active |
| Matilda | AU | Female | `XrExE9yKIg1WjnnlVkGX` | 11.4 dB | Active |
| Charlie | AU | Male | `IKne3meq5aSn9XLyUdCD` | 10.6 dB | Active |
| Aravind | IN | Male | `5Q0t7uMcjvnagumLfvZi` | 10.2 dB | Active |

---

## Deprecated Voices (DO NOT USE)

| Voice | HNR | Reason | Replaced By |
|-------|-----|--------|-------------|
| Marcus | 5.2 dB | Too raspy, below HNR threshold | Bill |
| David | 7.3 dB | Vocal fry, below HNR threshold | Michael |

**HNR Threshold:** All active voices must have HNR > 10.0 dB.

---

## Audio Coverage Status

### Word Pairs (RapidFire) - COMPLETE as of 2026-01-19

| Voice | Total Words | Coverage | Status |
|-------|-------------|----------|--------|
| Sarah | 1,847 | 100% | ✅ Complete |
| Emma | 1,847 | 100% | ✅ Complete |
| Bill | 1,847 | 100% | ✅ Regenerated |
| Michael | 1,847 | 100% | ✅ Regenerated |
| Alice | 1,847 | 100% | ✅ Regenerated |
| Daniel | 1,845 | 99.9% | ✅ Generated (missing: writing, zoo) |
| Matilda | 1,847 | 100% | ✅ Regenerated |
| Charlie | 1,847 | 100% | ✅ Regenerated |
| Aravind | 1,847 | 100% | ✅ Generated |

**All voices verified in Supabase storage:** `audio/words_v2/{voice}/`

### Sentences (Erber Level 4) - COMPLETE as of 2026-01-19

| Voice | Sentences | Coverage | Status |
|-------|-----------|----------|--------|
| Sarah | 628 | 100% | ✅ Complete |
| Emma | 618 | 100% | ✅ Complete |
| Bill | 618 | 100% | ✅ Complete |
| Michael | 618 | 100% | ✅ Complete |
| Alice | 617 | 99.8% | ✅ Complete (1 failed) |
| Daniel | 618 | 100% | ✅ Complete |
| Matilda | 618 | 100% | ✅ Complete |
| Charlie | 618 | 100% | ✅ Complete |
| Aravind | 618 | 100% | ✅ Complete |

**Total generated:** 4,953 files (99.98% success rate)
**All voices verified in Supabase storage:** `audio/sentences_v1/{voice}/`

### Stories (Karaoke Mode) - COMPLETE as of 2026-01-19

| Voice | Stories | Coverage | Status |
|-------|---------|----------|--------|
| Sarah | 12 | 100% | ✅ Complete |
| Emma | 12 | 100% | ✅ Complete |
| Bill | 12 | 100% | ✅ Complete |
| Michael | 12 | 100% | ✅ Complete |
| Alice | 12 | 100% | ✅ Complete |
| Daniel | 12 | 100% | ✅ Complete |
| Matilda | 12 | 100% | ✅ Complete |
| Charlie | 12 | 100% | ✅ Complete |
| Aravind | 12 | 100% | ✅ Complete |

**Total generated:** 94 files (100% success rate)
**All voices verified in Supabase storage:** `audio/stories/{voice}/`

**Note:** Schema migration `sql_migrations/add_story_voice_columns.sql` needed to add
database columns for new voices (bill, michael, alice, daniel, matilda, charlie, aravind).

### Scenarios
- 2 scenarios exist with audio complete
- Limited content - expansion planned for future

---

## Voice Details

### US Voices

#### Sarah (Female Standard)
- **ID:** `EXAVITQu4vr4xnSDxMaL`
- **HNR:** 13.7 dB (highest quality)
- **Character:** Clear, articulate, professional
- **Clinical Role:** Primary reference voice, baseline for training
- **Storage:** `audio/words_v2/sarah/`

#### Emma (Female High)
- **ID:** `OYTbf65OHHFELVut7v2H`
- **HNR:** 12.1 dB
- **Character:** Bright, energetic, natural conversational
- **Clinical Role:** Higher F0 for pitch discrimination training
- **Storage:** `audio/words_v2/emma/`

#### Bill (Male Standard)
- **ID:** `pqHfZKP75CvOlQylNhV4`
- **HNR:** 11.4 dB
- **Character:** Steady, natural, conversational
- **Clinical Role:** Primary US male voice (replaces Marcus)
- **Storage:** `audio/words_v2/bill/`

#### Michael (Male Deep)
- **ID:** `flq6f7yk4E4fJM5XTYuZ`
- **HNR:** 12.4 dB
- **Character:** Deep, clear, authoritative
- **Clinical Role:** Lower F0 male voice (replaces David)
- **Storage:** `audio/words_v2/michael/`

### UK Voices

#### Alice (Female)
- **ID:** `Xb7hH8MSUJpSbSDYk0k2`
- **HNR:** 11.2 dB
- **Character:** Standard British RP accent
- **Clinical Role:** UK accent exposure
- **Storage:** `audio/words_v2/alice/`

#### Daniel (Male)
- **ID:** `onwK4e9ZLuTAKqWW03F9`
- **HNR:** 12.1 dB
- **Character:** News anchor clarity, professional
- **Clinical Role:** UK male accent exposure
- **Storage:** `audio/words_v2/daniel/`

### AU Voices

#### Matilda (Female)
- **ID:** `XrExE9yKIg1WjnnlVkGX`
- **HNR:** 11.4 dB
- **Character:** Bright Australian accent
- **Clinical Role:** AU accent exposure
- **Storage:** `audio/words_v2/matilda/`

#### Charlie (Male)
- **ID:** `IKne3meq5aSn9XLyUdCD`
- **HNR:** 10.6 dB
- **Character:** Clear Australian accent
- **Clinical Role:** AU male accent exposure
- **Storage:** `audio/words_v2/charlie/`

### IN Voice

#### Aravind (Male)
- **ID:** `5Q0t7uMcjvnagumLfvZi`
- **HNR:** 10.2 dB
- **Character:** Global English, Indian accent
- **Clinical Role:** IN accent exposure for diverse training
- **Storage:** `audio/words_v2/aravind/`

---

## Generation Specifications

### Carrier Phrase Method
All audio generated using carrier phrase to prevent cold-start clipping:

```
Input: "The next word is [TARGET]."
Skip: First 0.95 seconds
Safety: 50ms padding preserved
Min Duration: 0.3 seconds (reject shorter)
```

### Normalization
- **Target LUFS:** -20.0 dB
- **Peak:** -1.5 dB TP
- **Sample Rate:** 44,100 Hz
- **Format:** MP3

### Voice Settings (ElevenLabs)
```python
{
    "model_id": "eleven_turbo_v2_5",
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.0
}
```

---

## CRITICAL: Audio URL Architecture

> **DO NOT add database columns for new voices. Audio URLs are constructed dynamically.**

### How Audio URLs Work

Audio files are stored in Supabase Storage with a predictable path pattern:

```
{SUPABASE_URL}/storage/v1/object/public/audio/words_v2/{voice}/{word}.mp3
```

Example:
```
https://padfntxzoxhozfjsqnzc.supabase.co/storage/v1/object/public/audio/words_v2/alice/bat.mp3
```

### Why NOT Database Columns

The original design (v2.5 schema) added database columns for each voice:
- `audio_1_path_sarah`, `audio_1_path_marcus`, etc.

**This approach doesn't scale.** Adding a new voice required:
1. SQL migration to add columns
2. Backfill script to populate paths
3. TypeScript types update
4. Multiple code changes

**Current approach (2026-02-06):** URLs are built dynamically in `useActivityData.ts`:

```typescript
function buildAudioUrl(voice: string, word: string): string {
  const normalized = word.toLowerCase().replace(/\s+/g, '_');
  return `${SUPABASE_URL}/storage/v1/object/public/audio/words_v2/${voice}/${normalized}.mp3`;
}
```

### Adding a New Voice

To add a new voice, you only need to:

1. **Generate audio** to Supabase Storage at `audio/words_v2/{new_voice}/`
2. **Add to `AVAILABLE_VOICES`** array in `src/hooks/useActivityData.ts`
3. **Add to `VOICES`** array in `src/store/VoiceContext.tsx`
4. **Update this doc** with voice details

**NO database migrations needed. NO TypeScript types changes needed.**

### Legacy Database Columns

The `word_pairs` table still has columns for the original 4 voices (sarah, marcus, emma, david).
These columns are **no longer used** by the app. They exist for backwards compatibility only.

---

## Files That Must Stay In Sync

When modifying voices, update ALL of these:

| File | Purpose |
|------|---------|
| `docs/VOICE_LIBRARY.md` | This file - source of truth |
| `src/store/VoiceContext.tsx` | Frontend voice selector (VOICES array) |
| `src/hooks/useActivityData.ts` | Audio URL builder (AVAILABLE_VOICES array) |
| `scripts/generate_library_v3_production.py` | Audio generation |

**Files that do NOT need updating:**
- Database schema (no columns needed)
- `src/types/database.types.ts` (audio columns are legacy)
- Migration scripts (not needed for new voices)

---

## Regeneration Commands (For Reference)

> **Note:** All regeneration completed 2026-01-19. Commands below for future use only.

### Regenerate Failed Words
```bash
python3 scripts/regenerate_multivoice_failed.py
```

### Generate New Voice
```bash
python3 scripts/generate_new_voices.py
```

---

## Version History

### 2026-02-06 - Dynamic Audio URL Architecture
- **BREAKING CHANGE:** Audio URLs now constructed dynamically, NOT read from database columns
- Removed dependency on `audio_1_path_{voice}` database columns
- All 9 voices now work via Supabase Storage path pattern
- Added `buildAudioUrl()` function in `useActivityData.ts`
- Added `AVAILABLE_VOICES` array to control which voices are active
- Legacy database columns (sarah, marcus, emma, david) still exist but are unused
- This change prevents the "only one voice playing" bug when VoiceContext lists voices without database columns

### 2026-01-19 - All Voices Complete
- Daniel & Aravind generation COMPLETE (verified in Supabase)
- All 9 voices now at 100% word coverage (1,847 words each)
- Daniel missing only 2 words (writing, zoo) - 99.9%
- Voice audio gaps blocker RESOLVED

### 2025-01-18 - Voice Audit & Cleanup
- Deprecated Marcus (5.2 dB HNR) and David (7.3 dB HNR)
- Confirmed 9-voice roster as active
- Documented 2,452 failed words needing regeneration
- Updated VoiceContext.tsx to remove deprecated voices
- Synced documentation across all files

### 2025-11-30 - Initial 9-Voice Roster
- Added Bill, Michael as US male replacements
- Added Alice, Daniel (UK), Matilda, Charlie (AU), Aravind (IN)
- Established HNR threshold > 10.0 dB

### 2025-11-29 - Original 4-Voice System
- Sarah, Marcus, Emma, David (before quality audit)
