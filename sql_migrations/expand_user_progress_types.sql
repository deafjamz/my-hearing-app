-- Migration: Expand user_progress content_type CHECK constraint
-- Adds 'phoneme_drill' and 'story_question' to the allowed content_type values.
-- Also backfills historical rows that were logged with wrong content_type.
--
-- Run in Supabase SQL Editor.

-- 1. Expand the CHECK constraint
ALTER TABLE user_progress DROP CONSTRAINT IF EXISTS user_progress_content_type_check;
ALTER TABLE user_progress ADD CONSTRAINT user_progress_content_type_check
CHECK (content_type IN (
  'word', 'sentence', 'story', 'scenario',
  'conversation', 'environmental',
  'phoneme_drill', 'story_question'
));

-- 2. Backfill: phoneme drills were logged as 'word'
UPDATE user_progress
SET content_type = 'phoneme_drill'
WHERE content_type = 'word'
  AND content_tags->>'activityType' = 'phoneme_drill';

-- 3. Backfill: conversations were logged as 'sentence'
UPDATE user_progress
SET content_type = 'conversation'
WHERE content_type = 'sentence'
  AND content_tags->>'activityType' = 'conversation';
