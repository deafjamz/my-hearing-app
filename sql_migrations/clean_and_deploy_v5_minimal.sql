-- Clean Slate Migration: Drop old tables and deploy fresh schema
-- This ensures no conflicts with existing data

-- =============================================================================
-- STEP 1: CLEAN UP (Drop existing tables if they exist)
-- =============================================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS audio_quality_report CASCADE;
DROP VIEW IF EXISTS user_clinical_summary CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS user_trials CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS noise_assets CASCADE;
DROP TABLE IF EXISTS audio_assets CASCADE;
DROP TABLE IF EXISTS story_questions CASCADE;
DROP TABLE IF EXISTS scenario_items CASCADE;
DROP TABLE IF EXISTS scenarios CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS sentences CASCADE;
DROP TABLE IF EXISTS word_pairs CASCADE;
DROP TABLE IF EXISTS stimuli_catalog CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS phoneme_position CASCADE;
DROP TYPE IF EXISTS vowel_type CASCADE;
DROP TYPE IF EXISTS content_tier CASCADE;

-- =============================================================================
-- STEP 2: CREATE FRESH SCHEMA
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STIMULI_CATALOG
CREATE TABLE stimuli_catalog (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('word', 'sentence', 'story', 'scenario')),

  -- Content
  text TEXT NOT NULL,
  text_alt TEXT,

  -- Clinical Metadata
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5) DEFAULT 3,
  target_phoneme TEXT,

  -- Access Control
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'standard', 'premium')),

  -- Tags
  tags JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. AUDIO_ASSETS (ElevenLabs-Enhanced)
CREATE TABLE audio_assets (
  id TEXT PRIMARY KEY,

  -- Link to stimulus
  stimulus_id TEXT REFERENCES stimuli_catalog(id) ON DELETE CASCADE,

  -- Voice Information
  voice_name TEXT NOT NULL,
  voice_gender TEXT CHECK (voice_gender IN ('male', 'female')),

  -- ElevenLabs Voice ID
  elevenlabs_voice_id TEXT,

  -- Storage
  storage_url TEXT NOT NULL,
  storage_bucket TEXT DEFAULT 'audio',
  storage_path TEXT NOT NULL,

  -- CRITICAL: Verified RMS for SNR Mixing
  verified_rms_db FLOAT NOT NULL DEFAULT -20.0,
  duration_ms INTEGER,

  -- ElevenLabs Quality Metrics
  f0_mean_hz FLOAT,
  f0_range_hz FLOAT,
  jitter FLOAT,
  shimmer FLOAT,
  hnr_db FLOAT,
  voiced_fraction FLOAT,

  -- Intelligibility
  stoi_score FLOAT CHECK (stoi_score BETWEEN 0 AND 1),
  intelligibility_pass BOOLEAN DEFAULT true,

  -- Forced Alignment
  alignment_data JSONB,
  alignment_url TEXT,

  -- ElevenLabs Generation Metadata
  elevenlabs_model TEXT DEFAULT 'eleven_multilingual_v2',
  elevenlabs_stability FLOAT,
  elevenlabs_similarity_boost FLOAT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

  -- Constraints
  CONSTRAINT unique_audio_url UNIQUE (storage_url),
  CONSTRAINT unique_stimulus_voice UNIQUE (stimulus_id, voice_name)
);

-- Indexes
CREATE INDEX idx_audio_assets_storage_url ON audio_assets(storage_url);
CREATE INDEX idx_audio_assets_voice_name ON audio_assets(voice_name);
CREATE INDEX idx_audio_assets_stimulus_id ON audio_assets(stimulus_id);

-- 3. NOISE_ASSETS
CREATE TABLE noise_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  name TEXT NOT NULL UNIQUE,
  description TEXT,

  category TEXT CHECK (category IN ('speech_babble', 'environmental', 'white_noise', 'pink_noise')),
  intensity TEXT CHECK (intensity IN ('quiet', 'moderate', 'loud')),

  storage_url TEXT NOT NULL UNIQUE,
  storage_bucket TEXT DEFAULT 'noise',
  storage_path TEXT NOT NULL,

  verified_rms_db FLOAT DEFAULT -20.0,
  duration_ms INTEGER,
  loop_compatible BOOLEAN DEFAULT false,

  elevenlabs_generated BOOLEAN DEFAULT false,
  elevenlabs_prompt TEXT,

  tags JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- STEP 3: ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE stimuli_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stimuli" ON stimuli_catalog
  FOR SELECT USING (true);

ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read audio assets" ON audio_assets
  FOR SELECT USING (true);

ALTER TABLE noise_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read noise assets" ON noise_assets
  FOR SELECT USING (true);

-- =============================================================================
-- STEP 4: HELPER VIEWS
-- =============================================================================

CREATE VIEW audio_quality_report AS
SELECT
  a.stimulus_id,
  a.voice_name,
  a.voice_gender,
  s.text,
  a.f0_mean_hz,
  a.hnr_db,
  a.stoi_score,
  a.intelligibility_pass,
  CASE
    WHEN a.voice_gender = 'male' AND a.f0_mean_hz BETWEEN 85 AND 180 THEN 'Optimal'
    WHEN a.voice_gender = 'female' AND a.f0_mean_hz BETWEEN 165 AND 265 THEN 'Optimal'
    ELSE 'Suboptimal'
  END as ci_suitability
FROM audio_assets a
JOIN stimuli_catalog s ON a.stimulus_id = s.id
WHERE a.f0_mean_hz IS NOT NULL;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Show created tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('stimuli_catalog', 'audio_assets', 'noise_assets')
ORDER BY table_name;
