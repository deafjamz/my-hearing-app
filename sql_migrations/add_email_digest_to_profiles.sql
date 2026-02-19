-- Add weekly email digest opt-in to profiles table
-- Part of Sprint 3 Phase D: Weekly Email Digest feature

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_weekly_digest BOOLEAN DEFAULT false;

-- Index for efficient querying of opted-in users
CREATE INDEX IF NOT EXISTS idx_profiles_email_weekly_digest
  ON profiles (email_weekly_digest)
  WHERE email_weekly_digest = true;

COMMENT ON COLUMN profiles.email_weekly_digest IS 'User opt-in for weekly training summary email (Monday 8am UTC)';
