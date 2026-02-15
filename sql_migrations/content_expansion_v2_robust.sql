-- =============================================================================
-- CONTENT EXPANSION V2 - ROBUST Migration
-- =============================================================================
-- This migration handles ALL edge cases:
-- 1. Table doesn't exist → Creates it
-- 2. Table exists but missing columns → Adds them
-- 3. Constraints already exist → Skips them
--
-- Run this migration in Supabase SQL Editor
-- Created: 2026-01-22
-- =============================================================================

-- STEP 1: Ensure stimuli_catalog table exists with basic structure
-- If table exists, this does nothing. If not, creates it.
CREATE TABLE IF NOT EXISTS stimuli_catalog (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- STEP 2: Add ALL columns that might be missing (safe - IF NOT EXISTS)
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'word';
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS text_alt TEXT;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS erber_level TEXT;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS difficulty INTEGER;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS target_phoneme TEXT;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS contrast_phoneme TEXT;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS phoneme_position TEXT;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'free';
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS drill_pack_id TEXT;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS prompt_text TEXT;
ALTER TABLE stimuli_catalog ADD COLUMN IF NOT EXISTS response_text TEXT;

-- STEP 3: Ensure audio_assets table exists
CREATE TABLE IF NOT EXISTS audio_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stimulus_id TEXT REFERENCES stimuli_catalog(id) ON DELETE CASCADE,
  voice_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- STEP 4: Add speaking_rate column to audio_assets
ALTER TABLE audio_assets ADD COLUMN IF NOT EXISTS speaking_rate TEXT DEFAULT 'normal';

-- STEP 5: Create indexes (IF NOT EXISTS handles re-runs)
CREATE INDEX IF NOT EXISTS idx_stimuli_type ON stimuli_catalog(type);
CREATE INDEX IF NOT EXISTS idx_stimuli_drill_pack ON stimuli_catalog(drill_pack_id);
CREATE INDEX IF NOT EXISTS idx_audio_stimulus ON audio_assets(stimulus_id);
CREATE INDEX IF NOT EXISTS idx_audio_speaking_rate ON audio_assets(speaking_rate);

-- STEP 6: Enable RLS (safe to run multiple times)
ALTER TABLE stimuli_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;

-- STEP 7: Drop and recreate policies (avoids conflicts)
DROP POLICY IF EXISTS "Public read stimuli" ON stimuli_catalog;
DROP POLICY IF EXISTS "stimuli_catalog_read_policy" ON stimuli_catalog;
DROP POLICY IF EXISTS "Public read audio" ON audio_assets;
DROP POLICY IF EXISTS "audio_assets_read_policy" ON audio_assets;

CREATE POLICY "Public read stimuli" ON stimuli_catalog FOR SELECT USING (true);
CREATE POLICY "Public read audio" ON audio_assets FOR SELECT USING (true);

-- STEP 8: Drop and recreate views (ensures they use current schema)
DROP VIEW IF EXISTS drill_pack_summary;
DROP VIEW IF EXISTS conversation_categories;
DROP VIEW IF EXISTS environmental_sound_categories;

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

CREATE VIEW conversation_categories AS
SELECT
  tags->>'category' as category,
  COUNT(*) as total_pairs,
  MIN(difficulty) as min_difficulty,
  MAX(difficulty) as max_difficulty
FROM stimuli_catalog
WHERE type = 'conversation'
GROUP BY tags->>'category';

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

-- STEP 9: Verify the schema
SELECT 'Migration complete! Columns in stimuli_catalog:' as status;
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'stimuli_catalog'
ORDER BY ordinal_position;
