-- Add 'scenario' to allowed content_type values in stimuli_catalog
-- Based on actual values in database: 'sentence', 'word_pair'

-- Drop the old constraint
ALTER TABLE stimuli_catalog DROP CONSTRAINT IF EXISTS stimuli_catalog_content_type_check;

-- Add the new constraint with all existing types plus 'scenario'
ALTER TABLE stimuli_catalog ADD CONSTRAINT stimuli_catalog_content_type_check
  CHECK (content_type IN ('scenario', 'sentence', 'word_pair'));

-- Verify the change
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'stimuli_catalog_content_type_check';
