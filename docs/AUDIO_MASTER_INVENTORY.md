# SoundSteps Audio Master Inventory

> **Last Updated:** 2026-01-25
> **Purpose:** Single source of truth for ALL audio assets - counts, quality, availability
> **Update Protocol:** Update this document whenever audio is generated, verified, or removed

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Audio Files** | **31,413** |
| **Total When Complete** | **~39,114** |
| **Completion Rate** | **80%** |
| **Active Voices** | **9** |
| **Content Types** | **8** |
| **Quality Standard** | **HNR ≥ 10.0 dB, -20 LUFS** |

### Quick Health Check

| Category | Status | Files | Notes |
|----------|--------|-------|-------|
| Words (Minimal Pairs) | ✅ COMPLETE | 20,301 | 100% coverage |
| Sentences v1 | ✅ COMPLETE | 5,659 | 100% coverage |
| Sentences v2 | ⚠️ PARTIAL | 2,790 | 49% - needs 2,862 more |
| Stories | ✅ COMPLETE | 440 | 50 stories × 9 voices |
| Conversations | ✅ COMPLETE | 1,400 | 80 pairs × 9 voices |
| Phoneme Drills | ✅ COMPLETE | 3,600 | 200 pairs × 9 voices |
| Environmental Sounds | ✅ COMPLETE | 50 | 50 unique sounds |
| Rate Variants | ✅ COMPLETE | 1,800 | 100 items × 2 rates × 9 voices |
| Scenarios | ⚠️ PARTIAL | 15 | 3% - needs 529 more |
| Noise Assets | ✅ COMPLETE | 8 | Clinical-grade |

---

## Detailed Inventory by Content Type

### 1. Word Pairs (Minimal Pairs) - Detection & Discrimination Training

**Purpose:** Phoneme discrimination training (Erber Level 2-3)

| Metric | Value |
|--------|-------|
| **Total Unique Words** | 1,847 |
| **Total Word Pairs** | 2,026 |
| **Total Audio Files** | 20,301 |
| **Storage Location** | `audio/words_v2/{voice}/` |
| **File Format** | MP3, 128kbps |
| **Database Table** | `word_pairs` |

#### Voice Coverage

| Voice | Files | Coverage | Quality (HNR) | Status |
|-------|-------|----------|---------------|--------|
| Sarah | 1,847 | 100% | 13.7 dB | ✅ Primary |
| Emma | 1,847 | 100% | 12.1 dB | ✅ Active |
| Bill | 1,845 | 100% | 11.4 dB | ✅ Active |
| Michael | 1,846 | 100% | 12.4 dB | ✅ Active |
| Alice | 1,843 | 100% | 11.2 dB | ✅ Active |
| Daniel | 1,845 | 99.9% | 12.1 dB | ✅ Active (missing: writing, zoo) |
| Matilda | 1,845 | 100% | 11.4 dB | ✅ Active |
| Charlie | 1,844 | 100% | 10.6 dB | ✅ Active |
| Aravind | 1,847 | 100% | 10.2 dB | ✅ Active |
| Marcus | 1,846 | 100% | 5.2 dB | ❌ DEPRECATED |
| David | 1,844 | 100% | 7.3 dB | ❌ DEPRECATED |

#### Phoneme Categories

| Category | Pairs | Examples |
|----------|-------|----------|
| Voicing Contrasts | 400+ | bat/pat, dog/tog |
| Place of Articulation | 350+ | pin/tin, mat/nat |
| Manner of Articulation | 300+ | ship/sip, cheap/jeep |
| Vowel Contrasts | 250+ | bit/beat, bet/bat |
| Consonant Clusters | 200+ | play/pray, spit/split |

---

### 2. Sentences - Comprehension Training (Erber Level 4)

**Purpose:** Sentence-level comprehension with keyword identification

#### Sentences v1 (Original Set)

| Metric | Value |
|--------|-------|
| **Total Sentences** | 628 |
| **Total Audio Files** | 5,659 |
| **Storage Location** | `audio/sentences_v1/{voice}/` |
| **Database Table** | `stimuli_catalog` + `audio_assets` |
| **Status** | ✅ COMPLETE |

| Voice | Files | Status |
|-------|-------|--------|
| Sarah | 628 | ✅ |
| Emma | 628 | ✅ |
| Bill | 628 | ✅ |
| Michael | 628 | ✅ |
| Alice | 628 | ✅ |
| Daniel | 628 | ✅ |
| Matilda | 628 | ✅ |
| Charlie | 628 | ✅ |
| Aravind | 628 | ✅ |
| Marcus | 7 | ⚠️ Deprecated |

#### Sentences v2 (Expansion Set)

| Metric | Value |
|--------|-------|
| **Total Sentences** | 628 |
| **Generated Files** | 2,790 |
| **Remaining Files** | 2,862 |
| **Storage Location** | `audio/sentences_v2/{voice}/` |
| **Status** | ⚠️ 49% COMPLETE |

| Voice | Generated | Remaining | Status |
|-------|-----------|-----------|--------|
| Sarah | 310 | 318 | ⚠️ Partial |
| Emma | 310 | 318 | ⚠️ Partial |
| Bill | 310 | 318 | ⚠️ Partial |
| Michael | 309 | 319 | ⚠️ Partial |
| Alice | 310 | 318 | ⚠️ Partial |
| Daniel | 310 | 318 | ⚠️ Partial |
| Matilda | 310 | 318 | ⚠️ Partial |
| Charlie | 310 | 318 | ⚠️ Partial |
| Aravind | 309 | 319 | ⚠️ Partial |

**Resume Command:**
```bash
python3 scripts/generate_sentences_v2.py  # Auto-resumes from checkpoint
```

---

### 3. Stories - Karaoke Mode (Extended Listening)

**Purpose:** Extended passage comprehension with word-level highlighting

| Metric | Value |
|--------|-------|
| **Total Stories** | 50 |
| **Total Audio Files** | 440 |
| **Storage Location** | `audio/stories/{voice}/` |
| **Database Table** | `stories` |
| **Status** | ✅ COMPLETE |

#### Stories by Category

| Category | Count | Description |
|----------|-------|-------------|
| Creative/Whimsical | 15 | Imaginative, fun narratives |
| Daily Life | 11 | Everyday situations |
| Health/Wellness | 10 | Medical, health topics |
| Workplace/Social | 8 | Professional interactions |
| Travel/Adventure | 5 | Travel experiences |

#### Voice Coverage

| Voice | Files | Duration (avg) | Status |
|-------|-------|----------------|--------|
| Sarah | 50 | ~45 sec | ✅ |
| Emma | 50 | ~45 sec | ✅ |
| Bill | 50 | ~45 sec | ✅ |
| Michael | 50 | ~45 sec | ✅ |
| Alice | 50 | ~45 sec | ✅ |
| Daniel | 50 | ~45 sec | ✅ |
| Matilda | 50 | ~45 sec | ✅ |
| Charlie | 50 | ~45 sec | ✅ |
| Aravind | 40 | ~45 sec | ⚠️ Missing 10 |

---

### 4. Conversations (Q&A Pairs) - Dialogue Practice

**Purpose:** Turn-taking practice with prompt/response pairs

| Metric | Value |
|--------|-------|
| **Total Pairs** | 80 |
| **Total Audio Files** | 1,400 |
| **Files Per Voice** | 160 (80 prompts + 80 responses) |
| **Storage Location** | `audio/conversations/{voice}/` |
| **Database Table** | `stimuli_catalog` |
| **Status** | ✅ COMPLETE |

#### Categories

| Category | Pairs | Real-World Context |
|----------|-------|-------------------|
| Appointments | 15 | Scheduling, reminders |
| Directions | 15 | Navigation, locations |
| Phone Calls | 15 | Phone etiquette |
| Shopping | 15 | Retail interactions |
| Social | 10 | Casual conversation |
| Medical | 10 | Healthcare settings |

---

### 5. Phoneme Drill Packs - Targeted Discrimination

**Purpose:** Focused minimal pair training by phoneme contrast

| Metric | Value |
|--------|-------|
| **Total Drill Packs** | 10 |
| **Pairs Per Pack** | 20 |
| **Total Pairs** | 200 |
| **Total Audio Files** | 3,600 |
| **Files Per Voice** | 400 (200 pairs × 2 words) |
| **Storage Location** | `audio/drills/{voice}/{pack_id}/` |
| **Database Table** | `stimuli_catalog` |
| **Status** | ✅ COMPLETE |

#### Drill Pack Inventory

| Pack ID | Contrast | Type | Clinical Focus |
|---------|----------|------|----------------|
| pack_p_vs_b | /p/ - /b/ | Voicing | Stop consonants |
| pack_t_vs_d | /t/ - /d/ | Voicing | Alveolar stops |
| pack_k_vs_g | /k/ - /g/ | Voicing | Velar stops |
| pack_f_vs_v | /f/ - /v/ | Voicing | Labiodental fricatives |
| pack_s_vs_z | /s/ - /z/ | Voicing | Alveolar sibilants |
| pack_ssh_vs_s | /ʃ/ - /s/ | Place | Palatal vs alveolar |
| pack_thth_vs_th | /θ/ - /ð/ | Voicing | Dental fricatives |
| pack_chdj_vs_ch | /tʃ/ - /dʒ/ | Voicing | Affricates |
| pack_i_vs_I | /i/ - /ɪ/ | Vowel | Tense vs lax |
| pack_eae_vs_ae | /ɛ/ - /æ/ | Vowel | Front vowels |

---

### 6. Environmental Sounds - Sound Awareness

**Purpose:** Real-world sound recognition training

| Metric | Value |
|--------|-------|
| **Total Sounds** | 50 |
| **Storage Location** | `audio/environmental/{category}/` |
| **Database Table** | `stimuli_catalog` |
| **Status** | ✅ COMPLETE |

#### Categories

| Category | Count | Examples |
|----------|-------|----------|
| Home | 15 | Doorbell, microwave, phone ring |
| Outdoor | 10 | Car horn, siren, dog bark |
| Communication | 10 | Text notification, email chime |
| Appliances | 10 | Washing machine, coffee maker |
| Safety (CRITICAL) | 5 | Smoke detector, fire alarm |

**Safety Note:** Safety sounds are marked `safety_critical: true` in metadata for priority training.

---

### 7. Rate Variants - Speaking Rate Training

**Purpose:** Comprehension at different speaking rates

| Metric | Value |
|--------|-------|
| **Total Items** | 100 |
| **Rates** | 2 (slow, fast) |
| **Total Audio Files** | 1,800 |
| **Storage Location** | `audio/rate_variants/{voice}/{rate}/` |
| **Status** | ✅ COMPLETE |

| Rate | Multiplier | Description |
|------|------------|-------------|
| Slow | 0.85x | Therapeutic pacing |
| Fast | 1.15x | Challenge mode |

---

### 8. Scenarios - Multi-Speaker Dialogue

**Purpose:** Real-world conversation with multiple speakers

| Metric | Value |
|--------|-------|
| **Total Scenarios** | 32 |
| **Dialogue Lines** | 136 |
| **Voice Combinations** | 4 |
| **Target Files** | 544 |
| **Generated Files** | 15 |
| **Storage Location** | `audio/scenarios/{combo_id}/` |
| **Database Table** | `scenario_items` |
| **Status** | ⚠️ 3% COMPLETE |

**Remaining Work:** 529 files needed

---

### 9. Background Noise Assets - SNR Training

**Purpose:** Clinical-grade noise for Speech-in-Noise training

| Metric | Value |
|--------|-------|
| **Total Files** | 8 |
| **Storage Location** | `audio/noise/` |
| **Database Table** | `noise_assets` |
| **Status** | ✅ COMPLETE |

| File | Category | Intensity | Use Case |
|------|----------|-----------|----------|
| babble_8talker_cafeteria.mp3 | Speech Babble | Moderate | SNR Tier 1 |
| restaurant_moderate.mp3 | Speech Babble | Moderate | SNR Tier 1 |
| speech_shaped_steady.mp3 | White Noise | Moderate | Baseline |
| speech_shaped_modulated.mp3 | White Noise | Modulated | Dynamic |
| competing_talker_female.mp3 | Speech Babble | Moderate | Voice Discrim |
| medical_office_ambient.mp3 | Environmental | Quiet | Scenarios |
| grocery_store_ambient.mp3 | Environmental | Loud | Scenarios |
| transit_ambient.mp3 | Environmental | Loud | Scenarios |

---

## Voice Library

### Active 9-Voice Clinical Roster

| Voice | Gender | Region | HNR | ElevenLabs ID | Primary Use |
|-------|--------|--------|-----|---------------|-------------|
| **Sarah** | Female | US | 13.7 dB | pNInz6obpgDQGcFmaJgB | Primary/Default |
| Emma | Female | US | 12.1 dB | XB0fDUnXU5powFXDhCwa | US Alternative |
| Bill | Male | US | 11.4 dB | pqHfZKP75CvOlQylNhV4 | US Male |
| Michael | Male | US | 12.4 dB | flq6f7yk4E4fJM5XTYuZ | US Male Alt |
| Alice | Female | UK | 11.2 dB | Xb7hH8MSUJpSbSDYk0k2 | UK Female |
| Daniel | Male | UK | 12.1 dB | onwK4e9ZLuTAKqWW03F9 | UK Male |
| Matilda | Female | AU | 11.4 dB | XrExE9yKIg1WjnnlVkGX | AU Female |
| Charlie | Male | AU | 10.6 dB | IKne3meq5aSn9XLyUdCD | AU Male |
| Aravind | Male | IN | 10.2 dB | v7HJfGjzXCN6tZhD3K8K | IN Male |

### Deprecated Voices (Do Not Use)

| Voice | HNR | Reason | Replaced By |
|-------|-----|--------|-------------|
| Marcus | 5.2 dB | Raspy, below quality threshold | Bill |
| David | 7.3 dB | Vocal fry, below threshold | Michael |

---

## Quality Standards

### Audio Quality Requirements

| Metric | Requirement | Measurement |
|--------|-------------|-------------|
| **Format** | MP3 | 128 kbps |
| **Loudness** | -20 LUFS | Target normalization |
| **Peak Level** | < -1 dB | Prevent clipping |
| **HNR** | ≥ 10.0 dB | Voice quality threshold |
| **Sample Rate** | 44.1 kHz | ElevenLabs output |

### Quality Verification

All audio files have metadata tracked in `audio_assets` table:
- `verified_rms_db` - Actual RMS level
- `f0_mean_hz` - Fundamental frequency
- `duration_ms` - Duration in milliseconds
- `stoi_score` - Speech intelligibility (0-1)
- `hnr_db` - Harmonics-to-noise ratio

---

## File Counts Summary

### By Content Type

| Type | Files | % of Total |
|------|-------|------------|
| Word Pairs | 20,301 | 64.6% |
| Sentences v1 | 5,659 | 18.0% |
| Phoneme Drills | 3,600 | 11.5% |
| Rate Variants | 1,800 | 5.7% |
| Conversations | 1,400 | 4.5% |
| Stories | 440 | 1.4% |
| Environmental | 50 | 0.2% |
| Scenarios | 15 | <0.1% |
| Noise | 8 | <0.1% |
| **TOTAL** | **31,413** | **100%** |

### By Voice (Active Only)

| Voice | Words | Sentences | Stories | Convos | Drills | Rate | Total |
|-------|-------|-----------|---------|--------|--------|------|-------|
| Sarah | 1,847 | 938 | 50 | 160 | 400 | 200 | 3,595 |
| Emma | 1,847 | 938 | 50 | 160 | 400 | 200 | 3,595 |
| Bill | 1,845 | 938 | 50 | 160 | 400 | 200 | 3,593 |
| Michael | 1,846 | 937 | 50 | 160 | 400 | 200 | 3,593 |
| Alice | 1,843 | 938 | 50 | 160 | 400 | 200 | 3,591 |
| Daniel | 1,845 | 938 | 50 | 160 | 400 | 200 | 3,593 |
| Matilda | 1,845 | 938 | 50 | 160 | 400 | 200 | 3,593 |
| Charlie | 1,844 | 938 | 50 | 160 | 400 | 200 | 3,592 |
| Aravind | 1,847 | 937 | 40 | 160 | 400 | 200 | 3,584 |

### By Activity/Exercise

| Activity | Content Used | Files Involved | User Tier |
|----------|--------------|----------------|-----------|
| Detection | Word Pairs | 20,301 | Free |
| Gross Discrimination | Word Pairs | 20,301 | Free |
| Word Pairs (RapidFire) | Word Pairs | 20,301 | Free |
| Sentences | Sentences v1 | 5,659 | Standard |
| Stories (Karaoke) | Stories | 440 | Standard |
| Conversations | Conversations | 1,400 | Standard |
| Phoneme Drills | Drill Packs | 3,600 | Premium |
| Rate Training | Rate Variants | 1,800 | Premium |
| Environmental | Env Sounds | 50 | Premium |
| Scenarios | Scenarios + Noise | 23 | Premium |

---

## Remaining Work

### Priority 1: Sentences v2 Completion
- **Files Needed:** 2,862
- **Estimated Credits:** 8,000-10,000
- **Impact:** Doubles sentence content library
- **Command:** `python3 scripts/generate_sentences_v2.py`

### Priority 2: Scenarios Completion
- **Files Needed:** 529
- **Estimated Credits:** 5,000+
- **Impact:** Enables multi-speaker dialogue exercises
- **Command:** `python3 scripts/generate_scenario_audio.py`

### Total Credits Needed
- Sentences v2: ~10,000
- Scenarios: ~5,000
- **Total: ~15,000 credits**

---

## Update Log

| Date | Action | Files Changed |
|------|--------|---------------|
| 2026-01-25 | Created master inventory | - |
| 2026-01-24 | Content Expansion v2 (partial) | +10,618 |
| 2026-01-23 | Ingested conversations, drills, environmental | +5,050 |
| 2026-01-22 | Story generation complete | +440 |
| 2026-01-19 | Voice regeneration complete | - |

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| [AUDIO_INVENTORY.md](./AUDIO_INVENTORY.md) | Detailed file paths and DB linkage |
| [VOICE_LIBRARY.md](./VOICE_LIBRARY.md) | Voice characteristics and selection |
| [STATUS.md](../STATUS.md) | Current project status |

---

**Maintainer:** Update this document after any audio generation session.
