-- ============================================================================
-- FORCE V5 SCHEMA DEPLOYMENT
-- Drops existing tables and creates clean v5 structure for sentences
-- ============================================================================

-- Drop existing tables (clean slate)
DROP TABLE IF EXISTS audio_assets CASCADE;
DROP TABLE IF EXISTS stimuli_catalog CASCADE;

-- ============================================================================
-- STIMULI_CATALOG TABLE
-- Master list of all content (sentences, words, stories)
-- ============================================================================
CREATE TABLE stimuli_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Content
  content_text TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('word', 'sentence', 'story')),

  -- Clinical Metadata (stored as JSONB for flexibility)
  clinical_metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Create index for faster content_type queries
CREATE INDEX idx_stimuli_catalog_content_type ON stimuli_catalog(content_type);

-- ============================================================================
-- AUDIO_ASSETS TABLE
-- Links stimuli to physical audio files
-- ============================================================================
CREATE TABLE audio_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Link to stimulus
  stimuli_id UUID REFERENCES stimuli_catalog(id) ON DELETE CASCADE,

  -- Storage
  storage_path TEXT NOT NULL UNIQUE,

  -- Voice
  voice_id TEXT NOT NULL,

  -- Audio Metrics
  verified_rms_db FLOAT DEFAULT -20.0,
  duration_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),

  -- Ensure one audio file per stimulus per voice
  CONSTRAINT unique_stimulus_voice UNIQUE (stimuli_id, voice_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_audio_assets_stimuli_id ON audio_assets(stimuli_id);
CREATE INDEX idx_audio_assets_storage_path ON audio_assets(storage_path);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Public read access for content
-- ============================================================================

-- Enable RLS
ALTER TABLE stimuli_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read stimuli" ON stimuli_catalog
  FOR SELECT USING (true);

CREATE POLICY "Public read audio assets" ON audio_assets
  FOR SELECT USING (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'stimuli_catalog created' AS status, COUNT(*) AS count FROM stimuli_catalog;
SELECT 'audio_assets created' AS status, COUNT(*) AS count FROM audio_assets;
