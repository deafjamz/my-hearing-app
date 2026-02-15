-- =============================================================================
-- Migration: Deploy v5 Schema - Formalize Clinical Conditions
-- Date: 2025-11-29
-- Purpose: Add dedicated columns for SNR tracking (condition_snr, condition_noise_type)
-- Rationale: Replace JSONB content_tags with type-safe INTEGER column for Smart Coach
-- =============================================================================

-- =============================================================================
-- STEP 1: Add New Columns to user_progress
-- =============================================================================

-- Add condition_snr (Signal-to-Noise Ratio in dB)
-- Per 10_CLINICAL_CONSTANTS.md: Valid range is -10 dB to +20 dB
-- Use NULL for quiet conditions (no noise)
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS condition_snr INTEGER
  CHECK (condition_snr BETWEEN -10 AND 20 OR condition_snr IS NULL);

-- Add condition_noise_type (Type of background noise)
-- Examples: 'babble_6talker', 'quiet', 'traffic', 'cafeteria'
ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS condition_noise_type TEXT
  DEFAULT 'quiet';

-- =============================================================================
-- STEP 2: Backfill Existing Data
-- =============================================================================

-- Backfill condition_snr from content_tags JSONB
-- Extract content_tags->>'snr' and cast to INTEGER
UPDATE user_progress
SET condition_snr = (content_tags->>'snr')::INTEGER
WHERE content_tags IS NOT NULL
  AND content_tags->>'snr' IS NOT NULL
  AND condition_snr IS NULL;

-- Backfill condition_noise_type from listening_condition
-- Map old listening_condition values to new noise types
UPDATE user_progress
SET condition_noise_type = CASE
  WHEN listening_condition LIKE '%babble%' THEN 'babble_6talker'
  WHEN listening_condition LIKE '%quiet%' THEN 'quiet'
  WHEN listening_condition LIKE '%noise%' THEN 'babble_6talker'
  ELSE 'quiet'
END
WHERE condition_noise_type = 'quiet' -- Only update defaults
  AND listening_condition IS NOT NULL;

-- =============================================================================
-- STEP 3: Set Defaults for NULL Values
-- =============================================================================

-- Default SNR to NULL for quiet conditions (no noise = no SNR)
UPDATE user_progress
SET condition_snr = NULL
WHERE condition_noise_type = 'quiet'
  AND condition_snr IS NULL;

-- For rows with noise but no SNR, default to +10 dB (beginner level)
UPDATE user_progress
SET condition_snr = 10
WHERE condition_noise_type != 'quiet'
  AND condition_snr IS NULL;

-- =============================================================================
-- STEP 4: Create Indexes for Smart Coach Queries
-- =============================================================================

-- Index for filtering by SNR range (Smart Coach analytics)
CREATE INDEX IF NOT EXISTS idx_user_progress_condition_snr
  ON user_progress(condition_snr)
  WHERE condition_snr IS NOT NULL;

-- Index for grouping by noise type
CREATE INDEX IF NOT EXISTS idx_user_progress_noise_type
  ON user_progress(condition_noise_type);

-- Composite index for Smart Coach convergence analysis
CREATE INDEX IF NOT EXISTS idx_user_progress_user_snr_date
  ON user_progress(user_id, condition_snr, created_at DESC);

-- =============================================================================
-- STEP 5: Add Comments for Documentation
-- =============================================================================

COMMENT ON COLUMN user_progress.condition_snr IS 'Signal-to-Noise Ratio in dB at time of trial. Range: -10 to +20 dB. NULL = quiet (no noise). Per 10_CLINICAL_CONSTANTS.md';

COMMENT ON COLUMN user_progress.condition_noise_type IS 'Type of background noise played during trial. Values: babble_6talker, quiet, traffic, cafeteria. Per 00_MASTER_RULES.md';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify backfill: Count rows with condition_snr populated
-- Expected: Should match count of rows with content_tags->>'snr'
-- SELECT
--   COUNT(*) FILTER (WHERE condition_snr IS NOT NULL) as snr_populated,
--   COUNT(*) FILTER (WHERE content_tags->>'snr' IS NOT NULL) as jsonb_snr_populated,
--   COUNT(*) as total_rows
-- FROM user_progress;

-- Verify SNR distribution
-- Expected: Most users should be in 0-15 dB range after Smart Coach convergence
-- SELECT
--   condition_noise_type,
--   condition_snr,
--   COUNT(*) as trial_count
-- FROM user_progress
-- WHERE condition_snr IS NOT NULL
-- GROUP BY condition_noise_type, condition_snr
-- ORDER BY condition_noise_type, condition_snr;

-- =============================================================================
-- ROLLBACK PLAN (If Needed)
-- =============================================================================

-- To rollback this migration:
-- ALTER TABLE user_progress DROP COLUMN IF EXISTS condition_snr;
-- ALTER TABLE user_progress DROP COLUMN IF EXISTS condition_noise_type;
-- DROP INDEX IF EXISTS idx_user_progress_condition_snr;
-- DROP INDEX IF EXISTS idx_user_progress_noise_type;
-- DROP INDEX IF EXISTS idx_user_progress_user_snr_date;
