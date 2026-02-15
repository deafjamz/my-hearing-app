-- =============================================================================
-- CONTENT EXPANSION V2 - FINAL Migration (Exception-Safe)
-- =============================================================================
-- Uses PL/pgSQL exception handling so each operation succeeds independently.
-- Will NOT stop on errors - each block handles its own exceptions.
-- =============================================================================

-- PART 1: Add columns to stimuli_catalog (each in its own block)
DO $$ BEGIN
  ALTER TABLE stimuli_catalog ADD COLUMN type TEXT DEFAULT 'word';
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE stimuli_catalog ADD COLUMN text_alt TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE stimuli_catalog ADD COLUMN erber_level TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE stimuli_catalog ADD COLUMN difficulty INTEGER;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE stimuli_catalog ADD COLUMN target_phoneme TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE stimuli_catalog ADD COLUMN contrast_phoneme TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE stimuli_catalog ADD COLUMN phoneme_position TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE stimuli_catalog ADD COLUMN tags JSONB;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE stimuli_catalog ADD COLUMN tier TEXT DEFAULT 'free';
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE stimuli_catalog ADD COLUMN drill_pack_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE stimuli_catalog ADD COLUMN prompt_text TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE stimuli_catalog ADD COLUMN response_text TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

-- PART 2: Add columns to audio_assets
DO $$ BEGIN
  ALTER TABLE audio_assets ADD COLUMN speaking_rate TEXT DEFAULT 'normal';
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE audio_assets ADD COLUMN stimulus_id TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
         WHEN undefined_table THEN NULL;
END $$;

-- PART 3: Create tables if they don't exist at all
CREATE TABLE IF NOT EXISTS stimuli_catalog (
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT 'word',
  text TEXT NOT NULL,
  text_alt TEXT,
  erber_level TEXT,
  difficulty INTEGER,
  target_phoneme TEXT,
  contrast_phoneme TEXT,
  phoneme_position TEXT,
  tags JSONB,
  tier TEXT DEFAULT 'free',
  drill_pack_id TEXT,
  prompt_text TEXT,
  response_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS audio_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stimulus_id TEXT,
  voice_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_url TEXT,
  duration_ms INTEGER,
  speaking_rate TEXT DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- PART 4: Create indexes (each in own block)
DO $$ BEGIN
  CREATE INDEX idx_stimuli_type ON stimuli_catalog(type);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_stimuli_drill_pack ON stimuli_catalog(drill_pack_id);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_audio_stimulus ON audio_assets(stimulus_id);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX idx_audio_speaking_rate ON audio_assets(speaking_rate);
EXCEPTION WHEN duplicate_table THEN NULL;
         WHEN undefined_column THEN NULL;
END $$;

-- PART 5: RLS (safe to run multiple times)
ALTER TABLE stimuli_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;

-- PART 6: Policies
DROP POLICY IF EXISTS "Public read stimuli" ON stimuli_catalog;
DROP POLICY IF EXISTS "Public read audio" ON audio_assets;
CREATE POLICY "Public read stimuli" ON stimuli_catalog FOR SELECT USING (true);
CREATE POLICY "Public read audio" ON audio_assets FOR SELECT USING (true);

-- PART 7: Views (drop first to recreate)
DROP VIEW IF EXISTS drill_pack_summary CASCADE;
DROP VIEW IF EXISTS conversation_categories CASCADE;
DROP VIEW IF EXISTS environmental_sound_categories CASCADE;

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

-- PART 8: Verify
SELECT 'SUCCESS: Migration complete!' as status;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stimuli_catalog'
ORDER BY ordinal_position;
