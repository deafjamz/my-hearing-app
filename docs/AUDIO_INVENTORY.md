# Audio Inventory & Database Mapping

> **Last Updated:** 2026-01-24 (Content Expansion v2 - Credits Exhausted)
> **Purpose:** Single source of truth for audio assets and their database linkage
> **Status:** ⚠️ Sentences v2 partially complete - see REMAINING WORK section

---

## Quick Reference

### Supabase Storage Structure

```
audio/
├── words/           # Legacy word audio (5 voices, 865 files) - DEPRECATED
│   └── {voice}/     # sarah, marcus, emma, david, bill
├── words_v2/        # Current word audio (11 voices, 20,301 files) ✅ LINKED
│   └── {voice}/     # sarah, emma, bill, michael, alice, daniel, matilda, charlie, aravind, marcus, david
├── sentences_v1/    # Sentence audio (10 voices, 5,659 files) ✅ LINKED
│   └── {voice}/     # All 9 active voices + marcus (partial)
├── stories/         # Story audio (9 voices, 440 files) ✅ COMPLETE
│   └── {voice}/     # 50 stories × 9 voices
├── scenarios/       # Multi-speaker dialogue (pilot complete)
│   └── {combo_id}/  # Voice combination folders
├── scenarios_v1/    # Legacy scenario audio (30 files)
├── noise/           # Background noise assets (8 files) ✅ COMPLETE
├── conversations/   # Q&A pair audio (9 voices, 1,400 files) ✅ NEW
│   └── {voice}/     # 80 pairs × prompt + response
├── drills/          # Phoneme drill audio (9 voices, ~3,600 files) ✅ NEW
│   └── {voice}/     # 200 pairs × word1 + word2
│       └── {pack_id}/
└── environmental/   # Environmental sounds (50 files) ✅ NEW
    └── {category}/  # home, outdoor, communication, appliances, safety
```

---

## Audio Content Inventory

### Words (Minimal Pairs)

| Location | Files | Voices | Per Voice | Database Table |
|----------|-------|--------|-----------|----------------|
| `audio/words_v2/` | **20,301** | 11 | ~1,845 | `word_pairs` |
| `audio/words/` | 865 | 5 | ~173 | `word_pairs` (legacy) |

**Voice Coverage (words_v2):**
| Voice | Files | Coverage |
|-------|-------|----------|
| sarah | 1,847 | 100% |
| emma | 1,847 | 100% |
| bill | 1,845 | 100% |
| michael | 1,846 | 100% |
| alice | 1,843 | 100% |
| daniel | 1,847 | 99.9% |
| matilda | 1,845 | 100% |
| charlie | 1,844 | 100% |
| aravind | 1,847 | 100% |
| marcus | 1,846 | deprecated |
| david | 1,844 | deprecated |

**Database Linkage:** ✅ COMPLETE - All 2,026 word pairs linked to 4 voices (sarah, marcus, emma, david).
Paths populated in `word_pairs.audio_{1,2}_path_{voice}` columns.

---

### Sentences

| Location | Files | Voices | Per Voice | Database Table |
|----------|-------|--------|-----------|----------------|
| `audio/sentences_v1/` | **5,659** | 10 | 628 | `stimuli_catalog` + `audio_assets` |

**Voice Coverage:**
| Voice | Files | Notes |
|-------|-------|-------|
| sarah | 628 | ✅ Linked |
| emma | 628 | ✅ Linked |
| bill | 628 | ✅ Linked |
| michael | 628 | ✅ Linked |
| alice | 628 | ✅ Linked |
| daniel | 628 | ✅ Linked |
| matilda | 628 | ✅ Linked |
| charlie | 628 | ✅ Linked |
| aravind | 628 | ✅ Linked |
| marcus | 7 | ⚠️ Partial (deprecated voice) |

**Source CSV:** `content/source_csvs/master_sentences.csv` (628 rows)

**Database Linkage:** ✅ COMPLETE - 5,034 new audio_assets entries created.
All 9 active voices linked via `stimuli_catalog` → `audio_assets` relationship.

---

### Stories

| Location | Files | Voices | Database Table |
|----------|-------|--------|----------------|
| `audio/stories/` | **440** | 9 | `stories` |

**Generation (2026-01-22):** ✅ COMPLETE - 440/440 (50 stories × 9 voices)

**Files by Category:**
| Category | Files |
|----------|-------|
| creative_whimsical | 135 |
| daily_life | 98 |
| health_wellness | 90 |
| workplace_social | 72 |
| travel_adventure | 45 |

**Database Linkage:** ✅ COMPLETE - `stories` table has `audio_{voice}_path` columns populated.
Generation script automatically updates paths during creation.

---

### Scenarios (Dialogue)

| Location | Files | Database Table |
|----------|-------|----------------|
| `audio/scenarios_v1/` | 30 | `scenario_items` (legacy) |
| `audio/scenarios/` | 15 (pilot) | `scenario_items` |

**Target:** 136 dialogue lines × 4 voice combos = 544 files

**Database:** `scenarios` (32 rows) + `scenario_items` (136 rows)
Audio paths in `scenario_items.audio_path` column.

---

### Noise Assets

| Location | Files | Database Table |
|----------|-------|----------------|
| `audio/noise/` | **8** | `noise_assets` |

**Files:**
- Tier 1: `babble_8talker_cafeteria.mp3`, `restaurant_moderate.mp3`, `speech_shaped_steady.mp3`
- Tier 2: `speech_shaped_modulated.mp3`, `competing_talker_female.mp3`
- Tier 3: `medical_office_ambient.mp3`, `grocery_store_ambient.mp3`, `transit_ambient.mp3`

---

### Conversations (Q&A Pairs) - NEW (2026-01-23)

| Location | Files | Voices | Per Voice | Database Table |
|----------|-------|--------|-----------|----------------|
| `audio/conversations/` | **1,400** | 9 | 160 (80×2) | `stimuli_catalog` (content_type='conversation') |

**Voice Coverage:** ✅ All 9 active voices complete

**Categories:**
| Category | Pairs |
|----------|-------|
| appointments | 15 |
| directions | 15 |
| phone_calls | 15 |
| shopping | 15 |
| social | 10 |
| medical | 10 |

**File Naming:** `{voice}/{id}_prompt.mp3` and `{voice}/{id}_response.mp3`

**Source CSV:** `content/source_csvs/conversations_v1.csv` (80 rows)

**Database Linkage:** ✅ COMPLETE - Stored in `stimuli_catalog` with `content_type='conversation'`.
Original CSV IDs stored in `clinical_metadata.csv_id`.

---

### Phoneme Drill Packs - NEW (2026-01-23)

| Location | Files | Voices | Per Voice | Database Table |
|----------|-------|--------|-----------|----------------|
| `audio/drills/` | **~3,600** | 9 | 400 (200×2) | `stimuli_catalog` (content_type='phoneme_drill') |

**Voice Coverage:** ✅ All 9 active voices complete

**Drill Packs (10 total):**
| Pack | Contrast | Pairs |
|------|----------|-------|
| pack_p_vs_b | /p/ vs /b/ | 20 |
| pack_t_vs_d | /t/ vs /d/ | 20 |
| pack_k_vs_g | /k/ vs /g/ | 20 |
| pack_f_vs_v | /f/ vs /v/ | 20 |
| pack_s_vs_z | /s/ vs /z/ | 20 |
| pack_ssh_vs_s | /ʃ/ vs /s/ | 20 |
| pack_thth_vs_th | /θ/ vs /ð/ | 20 |
| pack_chdj_vs_ch | /tʃ/ vs /dʒ/ | 20 |
| pack_i_vs_I | /i/ vs /ɪ/ | 20 |
| pack_eae_vs_ae | /ɛ/ vs /æ/ | 20 |

**File Naming:** `{voice}/{pack_id}/{id}_{word}.mp3`

**IPA Character Mapping (for file paths):**
- `/ʃ/` → `ssh`, `/θ/` `/ð/` → `thth`, `/tʃ/` `/dʒ/` → `chdj`
- `/ɪ/` → `I`, `/ɛ/` → `e`, `/æ/` → `ae`

**Source CSV:** `content/source_csvs/phoneme_drills_v1.csv` (200 rows)

**Database Linkage:** ✅ COMPLETE - Stored in `stimuli_catalog` with `content_type='phoneme_drill'`.
Pack assignments stored in `clinical_metadata.drill_pack_id`.

---

### Environmental Sounds - NEW (2026-01-23)

| Location | Files | Database Table |
|----------|-------|----------------|
| `audio/environmental/` | **50** | `stimuli_catalog` (content_type='environmental_sound') |

**Categories:**
| Category | Sounds | Examples |
|----------|--------|----------|
| home | 15 | doorbell, microwave beep, phone ring |
| outdoor | 10 | car horn, siren, dog bark |
| communication | 10 | text notification, email chime |
| appliances | 10 | washing machine, coffee maker |
| safety | 5 | smoke detector, fire alarm |

**File Naming:** `{category}/{id}.mp3`

**Source CSV:** `content/source_csvs/environmental_sounds_v1.csv` (50 rows)

**Database Linkage:** ✅ COMPLETE - Stored in `stimuli_catalog` with `content_type='environmental_sound'`.
Category and foil data stored in `clinical_metadata`.

---

## Database Tables Summary

| Table | Rows | Audio Linked | Notes |
|-------|------|--------------|-------|
| `word_pairs` | 2,026 | ✅ Complete | 4 voices (sarah, marcus, emma, david) |
| `stimuli_catalog` | ~3,100+ | ✅ Complete | Sentences, conversations, drills, env sounds |
| `audio_assets` | ~25,000+ | ✅ Complete | All content expansion files linked |
| `stories` | 62 | ✅ Complete | 440 audio files (50 × 9 voices) |
| `story_questions` | 200 | N/A | No audio needed |
| `scenarios` | 32 | N/A | Metadata only |
| `scenario_items` | 136 | ⚠️ Partial | 15 pilot files generated |
| `noise_assets` | 8 | ✅ Complete | All 8 clinical noise files |

### New Content Types in stimuli_catalog (2026-01-23)

| content_type | Rows | Audio Files | Notes |
|--------------|------|-------------|-------|
| `sentence` | 2,709 | 5,659 | Original sentences |
| `scenario` | 32 | 15 (pilot) | Scenario metadata |
| `word_pair` | 55 | N/A | Word pair metadata |
| `conversation` | 80 | 1,400 | Q&A pairs (NEW) |
| `phoneme_drill` | 200 | ~3,600 | Minimal pairs (NEW) |
| `environmental_sound` | 50 | 50 | Sound effects (NEW) |

---

## Completed Actions

### ✅ Content Expansion v2 (2026-01-23/24)
1. ~~**Generate conversation audio**~~ → 1,400 files (80 pairs × 9 voices × 2)
2. ~~**Generate phoneme drill audio**~~ → ~3,600 files (200 pairs × 9 voices × 2)
3. ~~**Generate environmental sounds**~~ → 50 files
4. ~~**Complete scenario audio**~~ → 529 files (129 lines × 4 voice combos)
5. ~~**Generate rate variants**~~ → 1,800 files (100 items × 2 rates × 9 voices)
6. ~~**Create stories_v3.csv**~~ → 50 NEW stories
7. ~~**Create sentences_v2.csv**~~ → 628 NEW sentences
8. ~~**Generate stories_v3 audio**~~ → 449 files (50 stories × 9 voices, 1 failed)
9. ~~**Generate sentences_v2 audio (PARTIAL)**~~ → 2,790 files (sentences 1-310 × 9 voices)
10. ~~**Ingest new content to stimuli_catalog**~~ → 330 rows (80+200+50)
11. ~~**Fix schema migration**~~ → Used PL/pgSQL exception handling
12. ~~**Fix IPA characters in file paths**~~ → Replaced with ASCII equivalents

**Total Generated This Session:** ~10,618 files

---

## ⚠️ REMAINING WORK (When Credits Available)

### Sentences v2 - Incomplete (2,862 files remaining)

**Completed:**
- Sentences 1-310: ✅ All 9 voices (2,790 files)
- Location: `audio/sentences_v2/{voice}/sentence_{1-310}.mp3`

**Remaining:**
- Sentences 311-628: ❌ Need all 9 voices (318 sentences × 9 voices = 2,862 files)
- Estimated credits: ~8,000-10,000

**Voice completion status:**
| Voice | Completed | Remaining |
|-------|-----------|-----------|
| sarah | 310 | 318 |
| emma | 310 | 318 |
| bill | 310 | 318 |
| michael | 309 | 319 |
| alice | 310 | 318 |
| daniel | 310 | 318 |
| matilda | 310 | 318 |
| charlie | 310 | 318 |
| aravind | 309 | 319 |

**To resume generation:**
```bash
cd /Users/clyle/Desktop/my-hearing-app
python3 scripts/generate_sentences_v2.py

# Script automatically:
# - Checks existing files in Supabase storage
# - Skips already-generated sentences
# - Continues from where it stopped
# - Has retry logic for failed files
```

**What the remaining sentences contain (311-628):**
- Categories: Outdoors, Entertainment, Technology, Travel, Transportation, Education, Cooking, Automotive, Nature, Sports, Finance, Art, Literature, Pets, Events
- Each sentence has: target_keyword, target_phoneme, acoustic_foil, semantic_foil
- Difficulty levels 1-3

### ✅ High Priority (Completed 2026-01-22)
1. ~~**Populate `sentences` table**~~ → Using `stimuli_catalog` + `audio_assets` instead
2. ~~**Link sentence audio paths**~~ → 5,034 new audio_assets entries
3. ~~**Link word audio paths**~~ → All 2,026 word pairs linked to 4 voices
4. ~~**Generate story audio**~~ → 440 files (50 stories × 9 voices)

### Remaining Actions (Credits Needed)
1. **Complete scenario audio** - 529 remaining files (544 total - 15 pilot)
2. **Generate speaking rate variants** - 100 items × slow/fast × 9 voices (deferred)
3. **Add word_pairs columns for additional voices** - bill, michael, alice, daniel, matilda, charlie, aravind
4. **Fix marcus sentences** - generate 621 missing files (low priority, deprecated voice)

---

## Storage URL Patterns

```
# Base URL
https://{project_id}.supabase.co/storage/v1/object/public/audio/

# Words
audio/words_v2/{voice}/{word}.mp3

# Sentences
audio/sentences_v1/{voice}/{sentence_id}.mp3

# Stories
audio/stories/{voice}/{story_id}.mp3

# Scenarios
audio/scenarios/{combo_id}/{item_id}.mp3

# Noise
audio/noise/{asset_name}.mp3

# Conversations (NEW)
audio/conversations/{voice}/{id}_prompt.mp3
audio/conversations/{voice}/{id}_response.mp3

# Phoneme Drills (NEW)
audio/drills/{voice}/{pack_id}/{id}_{word}.mp3

# Environmental Sounds (NEW)
audio/environmental/{category}/{id}.mp3

# Rate Variants (NEW)
audio/rate_variants/{voice}/{rate}/{id}.mp3

# Stories v3 (NEW - in progress)
audio/stories/{voice}/{story_id}.mp3  # Same path as v2, different story IDs

# Sentences v2 (NEW - in progress)
audio/sentences_v2/{voice}/{sentence_id}.mp3
```

---

## Useful Queries

### Check audio_assets by category
```sql
SELECT
  split_part(storage_path, '/', 1) as category,
  COUNT(*) as count
FROM audio_assets
GROUP BY category
ORDER BY count DESC;
```

### Check word_pairs audio coverage
```sql
SELECT
  COUNT(*) as total,
  COUNT(audio_1_path_sarah) as with_sarah,
  COUNT(audio_1_path_emma) as with_emma
FROM word_pairs;
```

### Check sentences (should be 0 until populated)
```sql
SELECT COUNT(*) FROM sentences;
```

---

## Related Files

| File | Purpose |
|------|---------|
| `content/source_csvs/master_sentences.csv` | 628 sentences with keywords |
| `content/source_csvs/minimal_pairs_master.csv` | 2,081 word pairs with phonemes |
| `content/source_csvs/stories_v2.csv` | 50 stories |
| `content/source_csvs/story_questions_v2.csv` | 200 comprehension questions |
| `content/source_csvs/scenarios_v2.csv` | 30 scenarios |
| `content/source_csvs/scenario_items_v2.csv` | 129 dialogue lines |
| `content/source_csvs/conversations_v1.csv` | 80 Q&A pairs (NEW) |
| `content/source_csvs/phoneme_drills_v1.csv` | 200 minimal pairs (NEW) |
| `content/source_csvs/environmental_sounds_v1.csv` | 50 sounds (NEW) |
| `content/source_csvs/rate_variants_v1.csv` | 100 rate variant items (NEW) |
| `content/source_csvs/stories_v3.csv` | 50 NEW stories (NEW) |
| `content/source_csvs/sentences_v2.csv` | 628 NEW sentences (NEW) |

---

## Generation Scripts

| Script | Purpose | Status |
|--------|---------|--------|
| `scripts/generate_stories_v2.py` | Story audio (50 × 9) | ✅ Complete |
| `scripts/generate_sentences_all_voices.py` | Sentence audio | ✅ Complete |
| `scripts/backfill_phoneme_pairs.py` | Word pair metadata | ✅ Complete |
| `scripts/generate_clinical_noise.py` | Clinical noise assets | ✅ Complete |
| `scripts/generate_conversations.py` | Q&A pair audio (80 × 9 × 2) | ✅ Complete |
| `scripts/generate_phoneme_drills.py` | Minimal pair audio (200 × 9 × 2) | ✅ Complete |
| `scripts/generate_environmental_sounds.py` | Environmental sound effects | ✅ Complete |
| `scripts/generate_rate_variants.py` | Slow/fast speech variants (1,800) | ✅ Complete |
| `scripts/generate_scenario_audio.py` | Multi-speaker dialogue (529) | ✅ Complete |
| `scripts/generate_stories_v3.py` | Stories v3 audio (450) | 🔄 In progress |
| `scripts/generate_sentences_v2.py` | Sentences v2 audio (5,652) | 🔄 In progress |

## Ingestion Scripts

| Script | Purpose | Status |
|--------|---------|--------|
| `scripts/ingest_stories_v2.py` | Story CSV → DB | ✅ Complete |
| `scripts/ingest_scenarios_v2.py` | Scenario CSV → DB | ✅ Complete |
| `scripts/ingest_conversations.py` | Conversation CSV → stimuli_catalog | ✅ Complete (NEW) |
| `scripts/ingest_phoneme_drills.py` | Drill CSV → stimuli_catalog | ✅ Complete (NEW) |
| `scripts/ingest_environmental.py` | Environmental CSV → stimuli_catalog | ✅ Complete (NEW) |

## Linkage Scripts

| Script | Purpose | Status |
|--------|---------|--------|
| `scripts/link_sentence_audio.py` | Links sentences_v1 audio to audio_assets | ✅ Complete |
| `scripts/link_word_audio.py` | Links words_v2 audio to word_pairs table | ✅ Complete |

---

## Schema Migrations (Content Expansion v2)

| File | Purpose | Status |
|------|---------|--------|
| `sql_migrations/content_expansion_v2_final.sql` | Add columns for new content types | ✅ Run |
| `sql_migrations/fix_content_types.sql` | Drop constraint to allow new types | ✅ Run |
