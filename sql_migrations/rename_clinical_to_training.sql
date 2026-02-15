-- Migration: Rename "clinical" terminology to "training" for regulatory compliance
-- Reason: FDA/Whoop ruling - avoid medical device classification
-- Date: 2026-01-25
--
-- IMPORTANT: Run this in Supabase SQL Editor
-- Back up your database before running!

-- ============================================================
-- STEP 1: Rename JSONB column in stimuli_catalog
-- ============================================================

-- Add new column
ALTER TABLE stimuli_catalog
ADD COLUMN IF NOT EXISTS training_metadata JSONB;

-- Copy data from old column to new
UPDATE stimuli_catalog
SET training_metadata = clinical_metadata
WHERE clinical_metadata IS NOT NULL;

-- Note: We keep clinical_metadata for now to avoid breaking running code
-- Drop it in a future migration after all code is updated

-- ============================================================
-- STEP 2: Create new view with safe naming
-- ============================================================

-- Create the renamed view
CREATE OR REPLACE VIEW user_training_summary AS
SELECT
  user_id,
  content_type,
  COUNT(*) as total_trials,
  SUM(CASE WHEN result = 'correct' THEN 1 ELSE 0 END) as correct_count,
  ROUND(
    100.0 * SUM(CASE WHEN result = 'correct' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    1
  ) as accuracy_percent,
  AVG(response_time_ms) as avg_response_time_ms,
  MAX(created_at) as last_practiced,
  -- SNR tracking
  AVG(condition_snr) as avg_snr,
  MIN(condition_snr) as best_snr
FROM user_progress
GROUP BY user_id, content_type;

-- Grant access
GRANT SELECT ON user_training_summary TO authenticated;
GRANT SELECT ON user_training_summary TO anon;

-- ============================================================
-- STEP 3: Rename noise asset (optional - run separately)
-- ============================================================

-- Rename the clinical babble asset
UPDATE noise_assets
SET name = 'babble_6talker'
WHERE name = 'babble_6talker_clinical';

-- ============================================================
-- STEP 4: Update any functions using old naming
-- ============================================================

-- If you have functions referencing clinical_metadata, update them here
-- Example:
-- CREATE OR REPLACE FUNCTION get_training_data(...)

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check stimuli_catalog has new column
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'stimuli_catalog' AND column_name = 'training_metadata';

-- Check view exists
-- SELECT * FROM user_training_summary LIMIT 5;

-- Check noise asset renamed
-- SELECT name FROM noise_assets WHERE name LIKE 'babble%';

-- ============================================================
-- ROLLBACK (if needed)
-- ============================================================

-- DROP VIEW IF EXISTS user_training_summary;
-- ALTER TABLE stimuli_catalog DROP COLUMN IF EXISTS training_metadata;
-- UPDATE noise_assets SET name = 'babble_6talker_clinical' WHERE name = 'babble_6talker';
