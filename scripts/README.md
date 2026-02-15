# SoundSteps Scripts

This directory contains Python scripts for data migration, audio verification, and content pipeline management.

## Setup

### 1. Install Python Dependencies

```bash
pip install -r scripts/requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Supabase
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
SUPABASE_ANON_KEY="your-anon-key"

# ElevenLabs (for audio generation)
ELEVENLABS_API_KEY="your-elevenlabs-key"
```

**Security Note:** Never commit `.env` to version control. It's already in `.gitignore`.

## Scripts

### Data Migration: `migrate_to_v5_schema.py`

Migrates existing data from CSV files to the new v5 schema (`stimuli_catalog`, `audio_assets`).

**Prerequisites:**
- Run `sql_migrations/schema_v5_core_alignment.sql` in Supabase first
- Ensure CSV files exist in `content/source_csvs/`

**Usage:**
```bash
python scripts/migrate_to_v5_schema.py
```

**What it does:**
1. Reads from `master_phonemes.csv`, `master_sentences.csv`, `master_stories.csv`
2. Populates `stimuli_catalog` table with content
3. Creates `audio_assets` entries for each voice (david, marcus, sarah, emma)
4. Maps audio URLs to GitHub CDN paths
5. Verifies migration success

**Output:**
```
📝 Migrating Phonemes (Word Pairs)...
  ✅ Inserted 100 phoneme stimuli
  ✅ Inserted 800 audio assets

📝 Migrating Sentences...
  ✅ Inserted 50 sentence stimuli
  ✅ Inserted 200 audio assets

🔍 Verifying Migration...
  📊 Words: 100
  📊 Sentences: 50
  🎵 Audio Assets: 1000
```

### Audio Verification: `verify_audio.py`

Verifies and normalizes audio files with intelligibility scoring.

**Usage:**
```bash
# Basic normalization
python verify_audio.py input.mp3 output.wav

# With STOI verification (requires reference audio)
python verify_audio.py input.mp3 output.wav --reference reference.wav --min-stoi 0.7
```

**What it does:**
1. Loads audio file
2. Trims silence (active speech detection)
3. Measures RMS amplitude
4. Normalizes to target dB level (default: -20.0 dB)
5. (Optional) Calculates STOI score vs. reference
6. Saves normalized audio
7. Returns metadata for Supabase

**Output:**
```json
{
  "success": true,
  "verified_rms_db": -20.0,
  "duration_ms": 3240,
  "stoi_score": 0.89,
  "intelligibility_pass": true
}
```

**Batch Processing:**
```bash
# Verify all audio in a directory
for file in audio/*.mp3; do
  python verify_audio.py "$file" "verified/$(basename $file .mp3).wav"
done
```

## Workflow

### New Content Pipeline

1. **Edit Content** - Update CSV files in `content/source_csvs/`
2. **Generate Audio** - Use ElevenLabs API to generate MP3 files
3. **Verify Audio** - Run `verify_audio.py` on all generated files
4. **Upload to Supabase** - Upload verified audio to Supabase Storage
5. **Update Database** - Run `migrate_to_v5_schema.py` to sync metadata

### Schema Updates

1. **Create Migration** - Add new `.sql` file to `sql_migrations/`
2. **Test Locally** - Run in Supabase SQL Editor
3. **Commit Changes** - Push to GitHub
4. **Deploy** - GitHub Actions will notify you to run migration in production

## Troubleshooting

### `pystoi` not found
```bash
pip install pystoi
```

### Supabase connection error
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- Verify Supabase project is active
- Check firewall/network access

### Audio verification fails
- Ensure input file is valid audio (MP3, WAV supported)
- Check file permissions
- Verify `librosa` and `soundfile` are installed

### Migration shows 0 records
- Verify CSV files exist and have correct format
- Check `stimuli_catalog` table exists (run schema migration first)
- Look for error messages in script output

## Best Practices

1. **Always test migrations locally first** - Use Supabase local development
2. **Backup before major migrations** - Export data via Supabase Dashboard
3. **Verify audio quality** - Listen to normalized files before deployment
4. **Use service role key sparingly** - Only for admin scripts, never in frontend
5. **Document schema changes** - Add comments to SQL migration files

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Librosa Documentation](https://librosa.org/doc/latest/index.html)
- [STOI (Intelligibility) Paper](https://ieeexplore.ieee.org/document/5713237)
- [ElevenLabs API](https://docs.elevenlabs.io/)
