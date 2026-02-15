-- Add new content types to stimuli_catalog constraint
-- Run this in Supabase SQL Editor

-- Drop the existing constraint
ALTER TABLE stimuli_catalog DROP CONSTRAINT IF EXISTS stimuli_catalog_content_type_check;

-- Add new constraint that includes all content types
ALTER TABLE stimuli_catalog ADD CONSTRAINT stimuli_catalog_content_type_check
CHECK (content_type IN (
  'word', 'sentence', 'story', 'scenario',
  'conversation', 'environmental_sound', 'phoneme_drill'
));

-- Verify
SELECT 'Constraint updated!' as status;
