-- =============================================================================
-- FIX CONTENT VIEWS V2 — Use correct production column names
-- =============================================================================
-- The original content_expansion_v2.sql views referenced `type` and `tags`
-- but production stimuli_catalog uses `content_type` and `clinical_metadata`.
--
-- Run this in Supabase SQL Editor to create/replace the views.
-- =============================================================================

-- 1. drill_pack_summary
CREATE OR REPLACE VIEW drill_pack_summary AS
SELECT
  drill_pack_id,
  MAX(clinical_metadata->>'pack_name') as pack_name,
  MAX(clinical_metadata->>'contrast_type') as contrast_type,
  MAX(target_phoneme) as target_phoneme,
  MAX(contrast_phoneme) as contrast_phoneme,
  COUNT(*) as total_pairs,
  MIN(difficulty) as min_difficulty,
  MAX(difficulty) as max_difficulty,
  MAX(tier) as tier
FROM stimuli_catalog
WHERE content_type = 'phoneme_drill' AND drill_pack_id IS NOT NULL
GROUP BY drill_pack_id;

-- 2. conversation_categories
CREATE OR REPLACE VIEW conversation_categories AS
SELECT
  clinical_metadata->>'category' as category,
  COUNT(*) as total_pairs,
  MIN(difficulty) as min_difficulty,
  MAX(difficulty) as max_difficulty,
  array_agg(DISTINCT target_phoneme) FILTER (WHERE target_phoneme IS NOT NULL) as target_phonemes
FROM stimuli_catalog
WHERE content_type = 'conversation'
GROUP BY clinical_metadata->>'category';

-- 3. environmental_sound_categories
CREATE OR REPLACE VIEW environmental_sound_categories AS
SELECT
  clinical_metadata->>'category' as category,
  COUNT(*) as total_sounds,
  COUNT(*) FILTER (WHERE (clinical_metadata->>'safety_critical')::boolean = true) as safety_critical_count,
  MIN(difficulty) as min_difficulty,
  MAX(difficulty) as max_difficulty
FROM stimuli_catalog
WHERE content_type = 'environmental_sound'
GROUP BY clinical_metadata->>'category';

-- Verify
-- SELECT * FROM drill_pack_summary LIMIT 5;
-- SELECT * FROM conversation_categories LIMIT 5;
-- SELECT * FROM environmental_sound_categories LIMIT 5;
