-- =============================================================================
-- CONTENT EXPANSION V2 - SAFE Migration
-- =============================================================================
-- This migration safely adds new columns and handles cases where the table
-- might not exist or have different constraints.
--
-- Run this migration in Supabase SQL Editor
-- Created: 2026-01-22
-- =============================================================================

-- First, check if stimuli_catalog exists. If not, create it.
CREATE TABLE IF NOT EXISTS stimuli_catalog (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'word',
  text TEXT NOT NULL,
  text_alt TEXT,
  erber_level TEXT,
  difficulty INTEGER,
  target_phoneme TEXT,
  contrast_phoneme TEXT,
  phoneme_position TEXT,
  tags JSONB,
  tier TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add new columns for content expansion (IF NOT EXISTS handles re-runs safely)
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS drill_pack_id TEXT;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS prompt_text TEXT;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS response_text TEXT;

-- Ensure all required columns exist
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS text_alt TEXT;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS contrast_phoneme TEXT;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS phoneme_position TEXT;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS difficulty INTEGER;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS erber_level TEXT;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';

-- Create audio_assets table if it doesn't exist
CREATE TABLE IF NOT EXISTS audio_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stimulus_id TEXT REFERENCES stimuli_catalog(id) ON DELETE CASCADE,
  voice_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  duration_ms INTEGER,
  speaking_rate TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add speaking_rate column if it doesn't exist
ALTER TABLE audio_assets ADD COLUMN IF NOT EXISTS speaking_rate TEXT DEFAULT 'normal';

-- Create indexes (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_stimuli_type ON stimuli_catalog(type);
CREATE INDEX IF NOT EXISTS idx_stimuli_drill_pack ON stimuli_catalog(drill_pack_id) WHERE drill_pack_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audio_stimulus ON audio_assets(stimulus_id);

-- Enable RLS
ALTER TABLE stimuli_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read stimuli" ON stimuli_catalog;
DROP POLICY IF EXISTS "stimuli_catalog_read_policy" ON stimuli_catalog;
DROP POLICY IF EXISTS "Public read audio" ON audio_assets;

-- Create read policies
CREATE POLICY "Public read stimuli" ON stimuli_catalog FOR SELECT USING (true);
CREATE POLICY "Public read audio" ON audio_assets FOR SELECT USING (true);

-- Create views (DROP first to allow recreation)
DROP VIEW IF EXISTS drill_pack_summary;
CREATE VIEW drill_pack_summary AS
SELECT
  drill_pack_id,
  MAX(tags->>'pack_name') as pack_name,
  MAX(tags->>'contrast_type') as contrast_type,
  MAX(target_phoneme) as target_phoneme,
  MAX(contrast_phoneme) as contrast_phoneme,
  COUNT(*) as total_pairs,
  MIN(difficulty) as min_difficulty,
  MAX(difficulty) as max_difficulty,
  MAX(tier) as tier
FROM stimuli_catalog
WHERE type = 'phoneme_drill' AND drill_pack_id IS NOT NULL
GROUP BY drill_pack_id;

DROP VIEW IF EXISTS conversation_categories;
CREATE VIEW conversation_categories AS
SELECT
  tags->>'category' as category,
  COUNT(*) as total_pairs,
  MIN(difficulty) as min_difficulty,
  MAX(difficulty) as max_difficulty
FROM stimuli_catalog
WHERE type = 'conversation'
GROUP BY tags->>'category';

DROP VIEW IF EXISTS environmental_sound_categories;
CREATE VIEW environmental_sound_categories AS
SELECT
  tags->>'category' as category,
  COUNT(*) as total_sounds,
  COUNT(*) FILTER (WHERE (tags->>'safety_critical')::boolean = true) as safety_critical_count,
  MIN(difficulty) as min_difficulty,
  MAX(difficulty) as max_difficulty
FROM stimuli_catalog
WHERE type = 'environmental_sound'
GROUP BY tags->>'category';

-- Verify the schema
SELECT 'stimuli_catalog columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stimuli_catalog'
ORDER BY ordinal_position;
