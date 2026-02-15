# SoundSteps Scripts

Audio generation, content ingestion, and utility scripts for the SoundSteps hearing training app.

> **Last Updated:** 2026-02-15 (Session 30b — repo consolidation)

## Setup

### 1. Install Python Dependencies

```bash
pip install -r scripts/requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the project root (see `.env.local.template`):

```bash
# Supabase
SUPABASE_URL="https://padfntxzoxhozfjsqnzc.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# ElevenLabs (for audio generation)
ELEVENLABS_API_KEY="your-elevenlabs-key"
```

**Security:** `.env` is in `.gitignore`. Never commit secrets.

---

## Script Categories

### Audio Generation (11 scripts)

These generate audio files using ElevenLabs TTS and upload to Supabase Storage.

| Script | Content Type | Model | Notes |
|--------|-------------|-------|-------|
| `generate_sentences_v2.py` | Sentences | eleven_turbo_v2_5 | Resume-capable, ~630 × 9 voices |
| `generate_stories_v3.py` | Stories | eleven_multilingual_v2 | Word-level timestamps for karaoke |
| `generate_scenario_audio.py` | Scenario dialogue | eleven_turbo_v2_5 | 40 scenarios, multi-speaker |
| `generate_conversations.py` | Conversations | eleven_turbo_v2_5 | 80 pairs |
| `generate_environmental_sounds.py` | Environmental | eleven_turbo_v2_5 | 50 sounds |
| `generate_phoneme_drills.py` | Phoneme drills | eleven_turbo_v2_5 | 200 pairs |
| `generate_rate_variants.py` | Rate variants | eleven_turbo_v2_5 | 100 items at varied speeds |
| `generate_sentences_all_voices.py` | Sentences (all voices) | eleven_turbo_v2_5 | Batch across 9 voices |
| `generate_babble_simple.py` | Babble noise | — | Multi-talker noise for SNR mixing |
| `generate_clinical_noise.py` | Training noise | — | Speech-shaped noise generation |
| `generate_speed_variants.py` | Speed variants | — | **ffmpeg only, zero credits** |

### Content Ingestion (5 scripts)

These read CSVs from `content/source_csvs/` and insert into Supabase tables.

| Script | Target Table |
|--------|-------------|
| `ingest_conversations.py` | stimuli_catalog + audio_assets |
| `ingest_environmental.py` | stimuli_catalog + audio_assets |
| `ingest_phoneme_drills.py` | stimuli_catalog + audio_assets |
| `ingest_scenarios_v2.py` | scenarios + scenario_items |
| `ingest_stories_v2.py` | stories + story_questions |

### Utilities (12 scripts)

| Script | Purpose |
|--------|---------|
| `verify_new_content.py` | Quality verification (duration, loudness, clipping) |
| `check_audio_files.py` | Check audio file existence in Supabase Storage |
| `check_supabase_storage.py` | Audit Supabase Storage bucket contents |
| `verify_db_state.py` | Verify database table row counts |
| `verify_programs_setup.py` | Verify programs/sessions schema |
| `backfill_sentence_database_v2.py` | Backfill sentence metadata |
| `link_sentence_audio.py` | Link sentence records to audio assets |
| `link_word_audio.py` | Link word pair records to audio assets |
| `link_github_audio.py` | Link legacy GitHub-hosted audio |
| `populate_sessions.py` | Populate session/program data |
| `sanitize_vocabulary.py` | Clean vocabulary entries |
| `download_pilot_batch.py` | Download pilot batch for validation |

---

## 9-Voice Roster

All generation scripts support these voices:

| Voice | Region | Gender | ElevenLabs Model |
|-------|--------|--------|-----------------|
| sarah | US | Female | eleven_turbo_v2_5 / eleven_multilingual_v2 |
| emma | US | Female | eleven_turbo_v2_5 / eleven_multilingual_v2 |
| bill | US | Male | eleven_turbo_v2_5 / eleven_multilingual_v2 |
| michael | US | Male | eleven_turbo_v2_5 / eleven_multilingual_v2 |
| alice | UK | Female | eleven_turbo_v2_5 / eleven_multilingual_v2 |
| daniel | UK | Male | eleven_turbo_v2_5 / eleven_multilingual_v2 |
| matilda | AU | Female | eleven_turbo_v2_5 / eleven_multilingual_v2 |
| charlie | AU | Male | eleven_turbo_v2_5 / eleven_multilingual_v2 |
| aravind | IN | Male | eleven_turbo_v2_5 / eleven_multilingual_v2 |

---

## Audio Standards

- **Format:** MP3 128kbps
- **Normalization:** -20 LUFS target
- **Peak:** < -1.5 dB true peak (no clipping)
- **Sample Rate:** 44.1 kHz
- **Storage:** Supabase Storage bucket `audio`
- **URL pattern:** `{SUPABASE_URL}/storage/v1/object/public/audio/{path}`

### Storage Path Conventions

```
audio/
├── words_v2/{voice}/{word}.mp3
├── sentences_v1/{voice}/sentence_{id}.mp3
├── stories/{voice}/story_v3_{category}_{id}.mp3
├── scenarios/{voice}/{scenario_id}_{order}.mp3
├── conversations/{voice}/conversation_{id}.mp3
├── environmental/{voice}/env_{id}.mp3
├── phoneme_drills/{voice}/drill_{id}.mp3
├── rate_variants/{voice}/rate_{id}.mp3
├── sentences_speed/{voice}/{rate}/sentence_{id}.mp3    ← speed variants
└── stories_speed/{voice}/{rate}/story_{id}.mp3         ← speed variants
```

---

## Common Workflows

### Generate New Content End-to-End

```bash
# 1. Edit CSV in content/source_csvs/
# 2. Generate audio
python3 scripts/generate_stories_v3.py --resume

# 3. Verify quality
python3 scripts/verify_new_content.py --type stories --spot-check

# 4. Ingest to database
python3 scripts/ingest_stories_v2.py
```

### Generate Speed Variants (Free — No Credits)

```bash
# Pilot mode (5 files × 2 voices × 2 rates)
python3 scripts/generate_speed_variants.py --pilot

# Full run (all sentences + stories × 9 voices × 2 rates)
python3 scripts/generate_speed_variants.py

# Specific voice/rate
python3 scripts/generate_speed_variants.py --voices sarah,emma --rates 1.2x
```

### Resume After Interruption

Most generation scripts save progress to `*_progress.json` and support `--resume`:

```bash
python3 scripts/generate_sentences_v2.py --resume
```

---

## Content CSVs

Source content lives in `content/source_csvs/`:

| File | Rows | Description |
|------|------|-------------|
| `stories_v3.csv` | 60 | Story transcripts with phonemic targets |
| `sentences_v2.csv` | 630 | Sentences with comprehension questions |
| `scenarios_v2.csv` | 40 | Scenario definitions (setting, noise type) |
| `scenario_items_v2.csv` | 313 | Dialogue lines for scenarios |
| `story_questions_v2.csv` | 240 | Story comprehension questions (4 per story) |
| `conversations_v1.csv` | 80 | Conversation pairs |
| `environmental_sounds_v1.csv` | 50 | Environmental sound descriptions |
| `phoneme_drills_v1.csv` | 200 | Phoneme drill pairs |
| `rate_variants_v1.csv` | 100 | Rate variant items |
| `minimal_pairs_master.csv` | 2,081 | Minimal pair word combinations |

---

## Troubleshooting

### ElevenLabs rate limit
Scripts include built-in retry with exponential backoff. If persistent, reduce `--batch-size`.

### Supabase upload fails
- Check `SUPABASE_SERVICE_ROLE_KEY` (not the anon key)
- Verify Storage bucket `audio` exists and has public read access
- Check file size (Supabase free tier: 50MB per file)

### ffmpeg not found (speed variants)
```bash
brew install ffmpeg   # macOS
```

### Resume file corrupted
Delete the `*_progress.json` file and restart generation. Already-uploaded files won't be re-uploaded (scripts check Storage first).
