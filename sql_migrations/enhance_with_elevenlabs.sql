-- Enhancement Migration: Add ElevenLabs Metadata to Existing Schema
-- This ADDS features without destroying existing data
-- Safe to run - uses "ADD COLUMN IF NOT EXISTS"

-- =============================================================================
-- 1. ENHANCE WORD_PAIRS with ElevenLabs Metadata
-- =============================================================================

-- Add voice quality columns (from clinical analysis)
ALTER TABLE word_pairs
  ADD COLUMN IF NOT EXISTS f0_mean_hz_sarah FLOAT,
  ADD COLUMN IF NOT EXISTS f0_mean_hz_marcus FLOAT,
  ADD COLUMN IF NOT EXISTS f0_mean_hz_emma FLOAT,
  ADD COLUMN IF NOT EXISTS f0_mean_hz_david FLOAT,

  -- Voice quality metrics (averaged across voices, or store per-voice if needed)
  ADD COLUMN IF NOT EXISTS jitter FLOAT,
  ADD COLUMN IF NOT EXISTS shimmer FLOAT,
  ADD COLUMN IF NOT EXISTS hnr_db FLOAT,
  ADD COLUMN IF NOT EXISTS voiced_fraction FLOAT,

  -- Verified RMS for each voice (critical for SNR mixing)
  ADD COLUMN IF NOT EXISTS verified_rms_sarah FLOAT DEFAULT -20.0,
  ADD COLUMN IF NOT EXISTS verified_rms_marcus FLOAT DEFAULT -20.0,
  ADD COLUMN IF NOT EXISTS verified_rms_emma FLOAT DEFAULT -20.0,
  ADD COLUMN IF NOT EXISTS verified_rms_david FLOAT DEFAULT -20.0,

  -- Intelligibility scores per voice
  ADD COLUMN IF NOT EXISTS stoi_score_sarah FLOAT,
  ADD COLUMN IF NOT EXISTS stoi_score_marcus FLOAT,
  ADD COLUMN IF NOT EXISTS stoi_score_emma FLOAT,
  ADD COLUMN IF NOT EXISTS stoi_score_david FLOAT,

  -- ElevenLabs voice IDs for regeneration
  ADD COLUMN IF NOT EXISTS elevenlabs_voice_id_sarah TEXT,
  ADD COLUMN IF NOT EXISTS elevenlabs_voice_id_marcus TEXT,
  ADD COLUMN IF NOT EXISTS elevenlabs_voice_id_emma TEXT,
  ADD COLUMN IF NOT EXISTS elevenlabs_voice_id_david TEXT,

  -- Forced alignment data (JSONB for karaoke mode)
  ADD COLUMN IF NOT EXISTS alignment_data_sarah JSONB,
  ADD COLUMN IF NOT EXISTS alignment_data_marcus JSONB,
  ADD COLUMN IF NOT EXISTS alignment_data_emma JSONB,
  ADD COLUMN IF NOT EXISTS alignment_data_david JSONB;

-- =============================================================================
-- 2. ENHANCE STORIES with ElevenLabs Metadata
-- =============================================================================

ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS f0_mean_hz_sarah FLOAT,
  ADD COLUMN IF NOT EXISTS f0_mean_hz_marcus FLOAT,
  ADD COLUMN IF NOT EXISTS f0_mean_hz_emma FLOAT,
  ADD COLUMN IF NOT EXISTS f0_mean_hz_david FLOAT,

  ADD COLUMN IF NOT EXISTS verified_rms_sarah FLOAT DEFAULT -20.0,
  ADD COLUMN IF NOT EXISTS verified_rms_marcus FLOAT DEFAULT -20.0,
  ADD COLUMN IF NOT EXISTS verified_rms_emma FLOAT DEFAULT -20.0,
  ADD COLUMN IF NOT EXISTS verified_rms_david FLOAT DEFAULT -20.0,

  ADD COLUMN IF NOT EXISTS stoi_score_sarah FLOAT,
  ADD COLUMN IF NOT EXISTS stoi_score_marcus FLOAT,
  ADD COLUMN IF NOT EXISTS stoi_score_emma FLOAT,
  ADD COLUMN IF NOT EXISTS stoi_score_david FLOAT,

  -- Alignment data already exists as paths, add JSONB too
  ADD COLUMN IF NOT EXISTS alignment_data_sarah JSONB,
  ADD COLUMN IF NOT EXISTS alignment_data_marcus JSONB,
  ADD COLUMN IF NOT EXISTS alignment_data_emma JSONB,
  ADD COLUMN IF NOT EXISTS alignment_data_david JSONB;

-- =============================================================================
-- 3. ENHANCE SENTENCES with ElevenLabs Metadata
-- =============================================================================

ALTER TABLE sentences
  ADD COLUMN IF NOT EXISTS f0_mean_hz_sarah FLOAT,
  ADD COLUMN IF NOT EXISTS f0_mean_hz_marcus FLOAT,
  ADD COLUMN IF NOT EXISTS f0_mean_hz_emma FLOAT,
  ADD COLUMN IF NOT EXISTS f0_mean_hz_david FLOAT,

  ADD COLUMN IF NOT EXISTS verified_rms_sarah FLOAT DEFAULT -20.0,
  ADD COLUMN IF NOT EXISTS verified_rms_marcus FLOAT DEFAULT -20.0,
  ADD COLUMN IF NOT EXISTS verified_rms_emma FLOAT DEFAULT -20.0,
  ADD COLUMN IF NOT EXISTS verified_rms_david FLOAT DEFAULT -20.0,

  ADD COLUMN IF NOT EXISTS stoi_score_sarah FLOAT,
  ADD COLUMN IF NOT EXISTS stoi_score_marcus FLOAT,
  ADD COLUMN IF NOT EXISTS stoi_score_emma FLOAT,
  ADD COLUMN IF NOT EXISTS stoi_score_david FLOAT,

  ADD COLUMN IF NOT EXISTS alignment_data_sarah JSONB,
  ADD COLUMN IF NOT EXISTS alignment_data_marcus JSONB,
  ADD COLUMN IF NOT EXISTS alignment_data_emma JSONB,
  ADD COLUMN IF NOT EXISTS alignment_data_david JSONB;

-- =============================================================================
-- 4. CREATE NOISE_ASSETS Table (New)
-- =============================================================================

CREATE TABLE IF NOT EXISTS noise_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Noise Identification
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Noise Type
  category TEXT CHECK (category IN ('speech_babble', 'environmental', 'white_noise', 'pink_noise')),
  intensity TEXT CHECK (intensity IN ('quiet', 'moderate', 'loud')),

  -- Storage
  storage_url TEXT NOT NULL UNIQUE,
  storage_bucket TEXT DEFAULT 'noise',
  storage_path TEXT NOT NULL,

  -- Audio Characteristics
  verified_rms_db FLOAT DEFAULT -20.0,
  duration_ms INTEGER,
  loop_compatible BOOLEAN DEFAULT false,

  -- ElevenLabs Generation
  elevenlabs_generated BOOLEAN DEFAULT false,
  elevenlabs_prompt TEXT,

  tags JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for noise_assets
ALTER TABLE noise_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read noise assets" ON noise_assets
  FOR SELECT USING (true);

-- =============================================================================
-- 5. POPULATE DEFAULT VOICE METADATA (From Clinical Analysis)
-- =============================================================================

-- Update existing word_pairs with default F0 values
UPDATE word_pairs
SET
  f0_mean_hz_david = 118.4,
  f0_mean_hz_marcus = 144.4,
  f0_mean_hz_sarah = 171.6,
  f0_mean_hz_emma = 186.9
WHERE f0_mean_hz_david IS NULL;

-- Update stories with default F0 values
UPDATE stories
SET
  f0_mean_hz_david = 118.4,
  f0_mean_hz_marcus = 144.4,
  f0_mean_hz_sarah = 171.6,
  f0_mean_hz_emma = 186.9
WHERE f0_mean_hz_david IS NULL;

-- Update sentences with default F0 values
UPDATE sentences
SET
  f0_mean_hz_david = 118.4,
  f0_mean_hz_marcus = 144.4,
  f0_mean_hz_sarah = 171.6,
  f0_mean_hz_emma = 186.9
WHERE f0_mean_hz_david IS NULL;

-- =============================================================================
-- 6. CREATE HELPER VIEWS
-- =============================================================================

-- View: Voice quality report for word pairs
CREATE OR REPLACE VIEW word_pairs_quality_report AS
SELECT
  id,
  word_1,
  word_2,
  f0_mean_hz_david,
  f0_mean_hz_sarah,
  stoi_score_david,
  stoi_score_sarah,
  CASE
    WHEN f0_mean_hz_david BETWEEN 85 AND 180 THEN 'Optimal'
    ELSE 'Suboptimal'
  END as david_ci_suitability,
  CASE
    WHEN f0_mean_hz_sarah BETWEEN 165 AND 265 THEN 'Optimal'
    ELSE 'Suboptimal'
  END as sarah_ci_suitability
FROM word_pairs;

-- View: Combined content catalog (mimics stimuli_catalog concept)
CREATE OR REPLACE VIEW content_catalog AS
SELECT
  id,
  'word' as type,
  word_1 as text,
  word_2 as text_alt,
  category,
  difficulty,
  tier,
  target_phoneme,
  contrast_phoneme
FROM word_pairs
UNION ALL
SELECT
  id::TEXT,
  'sentence' as type,
  text,
  NULL as text_alt,
  NULL as category,
  difficulty::TEXT,
  tier::TEXT,
  target_word as target_phoneme,
  NULL as contrast_phoneme
FROM sentences
UNION ALL
SELECT
  id,
  'story' as type,
  title as text,
  NULL as text_alt,
  NULL as category,
  NULL as difficulty,
  tier,
  NULL as target_phoneme,
  NULL as contrast_phoneme
FROM stories;

-- =============================================================================
-- 7. INSERT SAMPLE NOISE ASSETS
-- =============================================================================

INSERT INTO noise_assets (name, description, category, intensity, storage_url, storage_path, verified_rms_db, loop_compatible)
VALUES
  ('cafeteria_moderate', 'Moderate cafeteria background noise', 'speech_babble', 'moderate',
   'https://cdn.jsdelivr.net/gh/deafjamz/hearing-rehab-audio@main/noise/cafeteria_moderate.mp3',
   'noise/cafeteria_moderate.mp3', -25.0, true),

  ('restaurant_busy', 'Busy restaurant ambient noise', 'environmental', 'loud',
   'https://cdn.jsdelivr.net/gh/deafjamz/hearing-rehab-audio@main/noise/restaurant_busy.mp3',
   'noise/restaurant_busy.mp3', -22.0, true),

  ('white_noise', 'White noise for testing', 'white_noise', 'moderate',
   'https://cdn.jsdelivr.net/gh/deafjamz/hearing-rehab-audio@main/noise/white_noise.mp3',
   'noise/white_noise.mp3', -20.0, true)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Show enhanced word_pairs structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'word_pairs'
AND column_name LIKE '%f0%' OR column_name LIKE '%rms%' OR column_name LIKE '%stoi%'
ORDER BY column_name;

-- Count existing data
SELECT 'word_pairs' as table_name, COUNT(*) as row_count FROM word_pairs
UNION ALL
SELECT 'sentences', COUNT(*) FROM sentences
UNION ALL
SELECT 'stories', COUNT(*) FROM stories
UNION ALL
SELECT 'noise_assets', COUNT(*) FROM noise_assets;

-- Show sample data with new fields
SELECT id, word_1, word_2, f0_mean_hz_david, f0_mean_hz_sarah
FROM word_pairs
LIMIT 3;
