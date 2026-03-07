-- Persist user's active training language in profiles.
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_language TEXT
CHECK (preferred_language IN ('en', 'es'));

COMMENT ON COLUMN profiles.preferred_language IS
'Primary training language preference. Used to default English or Spanish content selection.';
