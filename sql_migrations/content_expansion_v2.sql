-- =============================================================================
-- CONTENT EXPANSION V2 - Schema Migration
-- =============================================================================
-- Extends the database schema to support new content types:
-- - Conversational pairs (Q&A training)
-- - Environmental sounds (non-speech awareness)
-- - Phoneme drill packs (targeted discrimination)
-- - Speaking rate variants (temporal processing)
--
-- Run this migration ONCE in Supabase SQL Editor
-- Created: 2026-01-22
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. EXTEND stimuli_catalog TYPE CONSTRAINT
-- =============================================================================
-- Current: 'word', 'sentence', 'story', 'scenario'
-- Add: 'conversation', 'environmental_sound', 'phoneme_drill'

-- Drop existing constraint if it exists
ALTER TABLE stimuli_catalog
DROP CONSTRAINT IF EXISTS stimuli_catalog_type_check;

-- Add updated constraint with new types
ALTER TABLE stimuli_catalog
ADD CONSTRAINT stimuli_catalog_type_check
CHECK (type IN ('word', 'sentence', 'story', 'scenario',
                'conversation', 'environmental_sound', 'phoneme_drill'));

-- =============================================================================
-- 2. EXTEND user_progress CONTENT_TYPE
-- =============================================================================
-- Add new content types for progress tracking

ALTER TABLE user_progress
DROP CONSTRAINT IF EXISTS user_progress_content_type_check;

ALTER TABLE user_progress
ADD CONSTRAINT user_progress_content_type_check
CHECK (content_type IN ('word', 'sentence', 'story', 'scenario',
                        'conversation', 'environmental'));

-- =============================================================================
-- 3. ADD speaking_rate TO audio_assets
-- =============================================================================
-- For rate variant audio (slow/normal/fast)

ALTER TABLE audio_assets
ADD COLUMN IF NOT EXISTS speaking_rate TEXT DEFAULT 'normal'
CHECK (speaking_rate IN ('slow', 'normal', 'fast'));

-- =============================================================================
-- 4. ADD drill_pack_id TO stimuli_catalog
-- =============================================================================
-- For grouping phoneme drills by contrast type

ALTER TABLE stimuli_catalog
ADD COLUMN IF NOT EXISTS drill_pack_id TEXT;

-- =============================================================================
-- 5. ADD CONVERSATION METADATA COLUMNS TO stimuli_catalog
-- =============================================================================
-- For Q&A pairs: store both prompt and response text

ALTER TABLE stimuli_catalog
ADD COLUMN IF NOT EXISTS prompt_text TEXT,      -- Q in Q&A pairs
ADD COLUMN IF NOT EXISTS response_text TEXT;    -- A in Q&A pairs

-- =============================================================================
-- 6. ADD text_alt COLUMN FOR MINIMAL PAIRS
-- =============================================================================
-- For phoneme drills: stores the contrast word (word_2 in minimal pairs)

ALTER TABLE stimuli_catalog
ADD COLUMN IF NOT EXISTS text_alt TEXT;

-- =============================================================================
-- 7. ADD contrast_phoneme COLUMN
-- =============================================================================
-- For phoneme drills: the contrasting sound

ALTER TABLE stimuli_catalog
ADD COLUMN IF NOT EXISTS contrast_phoneme TEXT;

-- =============================================================================
-- 8. ADD phoneme_position COLUMN
-- =============================================================================
-- For phoneme drills: initial/medial/final position

ALTER TABLE stimuli_catalog
ADD COLUMN IF NOT EXISTS phoneme_position TEXT
CHECK (phoneme_position IN ('initial', 'medial', 'final') OR phoneme_position IS NULL);

-- =============================================================================
-- 9. CREATE INDEXES FOR NEW QUERY PATTERNS
-- =============================================================================

-- Index for drill pack queries
CREATE INDEX IF NOT EXISTS idx_stimuli_drill_pack
ON stimuli_catalog(drill_pack_id)
WHERE drill_pack_id IS NOT NULL;

-- Index for speaking rate queries
CREATE INDEX IF NOT EXISTS idx_audio_speaking_rate
ON audio_assets(speaking_rate)
WHERE speaking_rate != 'normal';

-- Index for conversation type queries
CREATE INDEX IF NOT EXISTS idx_stimuli_conversation
ON stimuli_catalog(type)
WHERE type = 'conversation';

-- Index for environmental sound queries
CREATE INDEX IF NOT EXISTS idx_stimuli_environmental
ON stimuli_catalog(type)
WHERE type = 'environmental_sound';

-- =============================================================================
-- 10. CREATE drill_pack_summary VIEW
-- =============================================================================
-- Aggregates drill pack metadata for UI display

CREATE OR REPLACE VIEW drill_pack_summary AS
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

-- =============================================================================
-- 11. CREATE conversation_categories VIEW
-- =============================================================================
-- Aggregates conversation metadata for UI display

CREATE OR REPLACE VIEW conversation_categories AS
SELECT
  tags->>'category' as category,
  COUNT(*) as total_pairs,
  MIN(difficulty) as min_difficulty,
  MAX(difficulty) as max_difficulty,
  array_agg(DISTINCT target_phoneme) FILTER (WHERE target_phoneme IS NOT NULL) as target_phonemes
FROM stimuli_catalog
WHERE type = 'conversation'
GROUP BY tags->>'category';

-- =============================================================================
-- 12. CREATE environmental_sound_categories VIEW
-- =============================================================================
-- Aggregates environmental sound metadata for UI display

CREATE OR REPLACE VIEW environmental_sound_categories AS
SELECT
  tags->>'category' as category,
  COUNT(*) as total_sounds,
  COUNT(*) FILTER (WHERE (tags->>'safety_critical')::boolean = true) as safety_critical_count,
  MIN(difficulty) as min_difficulty,
  MAX(difficulty) as max_difficulty
FROM stimuli_catalog
WHERE type = 'environmental_sound'
GROUP BY tags->>'category';

-- =============================================================================
-- 13. ADD RLS POLICIES FOR NEW CONTENT TYPES
-- =============================================================================

-- Enable RLS if not already enabled
ALTER TABLE stimuli_catalog ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read stimuli
DROP POLICY IF EXISTS stimuli_catalog_read_policy ON stimuli_catalog;
CREATE POLICY stimuli_catalog_read_policy ON stimuli_catalog
  FOR SELECT USING (true);

-- Policy: Only service role can insert/update
DROP POLICY IF EXISTS stimuli_catalog_write_policy ON stimuli_catalog;
CREATE POLICY stimuli_catalog_write_policy ON stimuli_catalog
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- VERIFICATION QUERIES (run these after migration)
-- =============================================================================

-- Check new columns exist
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'stimuli_catalog'
-- AND column_name IN ('drill_pack_id', 'prompt_text', 'response_text',
--                     'text_alt', 'contrast_phoneme', 'phoneme_position');

-- Check new constraint
-- SELECT conname, consrc
-- FROM pg_constraint
-- WHERE conname = 'stimuli_catalog_type_check';

-- Check indexes
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'stimuli_catalog'
-- AND indexname LIKE 'idx_stimuli%';

-- Check views
-- SELECT viewname FROM pg_views WHERE schemaname = 'public'
-- AND viewname IN ('drill_pack_summary', 'conversation_categories', 'environmental_sound_categories');

COMMIT;

-- =============================================================================
-- ROLLBACK (if needed)
-- =============================================================================
--
-- BEGIN;
-- ALTER TABLE stimuli_catalog DROP COLUMN IF EXISTS drill_pack_id;
-- ALTER TABLE stimuli_catalog DROP COLUMN IF EXISTS prompt_text;
-- ALTER TABLE stimuli_catalog DROP COLUMN IF EXISTS response_text;
-- ALTER TABLE stimuli_catalog DROP COLUMN IF EXISTS text_alt;
-- ALTER TABLE stimuli_catalog DROP COLUMN IF EXISTS contrast_phoneme;
-- ALTER TABLE stimuli_catalog DROP COLUMN IF EXISTS phoneme_position;
-- ALTER TABLE audio_assets DROP COLUMN IF EXISTS speaking_rate;
-- DROP VIEW IF EXISTS drill_pack_summary;
-- DROP VIEW IF EXISTS conversation_categories;
-- DROP VIEW IF EXISTS environmental_sound_categories;
-- DROP INDEX IF EXISTS idx_stimuli_drill_pack;
-- DROP INDEX IF EXISTS idx_audio_speaking_rate;
-- DROP INDEX IF EXISTS idx_stimuli_conversation;
-- DROP INDEX IF EXISTS idx_stimuli_environmental;
-- COMMIT;
