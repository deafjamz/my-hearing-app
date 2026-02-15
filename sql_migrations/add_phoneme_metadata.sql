-- =============================================================================
-- PHONEME METADATA MIGRATION
-- =============================================================================
-- Adds clinical phoneme organization to word_pairs table
-- Enables filtering by contrast category for targeted phoneme training
--
-- Run this migration to support the Phoneme Focus UI module
-- =============================================================================

-- Add phoneme metadata columns to word_pairs
ALTER TABLE word_pairs
ADD COLUMN IF NOT EXISTS contrast_category TEXT,
ADD COLUMN IF NOT EXISTS phoneme_1_ipa TEXT,
ADD COLUMN IF NOT EXISTS phoneme_2_ipa TEXT,
ADD COLUMN IF NOT EXISTS contrast_position TEXT;

-- Add comments for documentation
COMMENT ON COLUMN word_pairs.contrast_category IS 'Clinical phoneme contrast category (e.g., stops_voiced_voiceless, fricatives_place)';
COMMENT ON COLUMN word_pairs.phoneme_1_ipa IS 'IPA symbol for first phoneme in contrast (e.g., /p/)';
COMMENT ON COLUMN word_pairs.phoneme_2_ipa IS 'IPA symbol for second phoneme in contrast (e.g., /b/)';
COMMENT ON COLUMN word_pairs.contrast_position IS 'Position of contrast in word: initial, medial, final';

-- Create index for efficient category filtering
CREATE INDEX IF NOT EXISTS idx_word_pairs_contrast_category
ON word_pairs(contrast_category);

CREATE INDEX IF NOT EXISTS idx_word_pairs_contrast_position
ON word_pairs(contrast_position);

-- =============================================================================
-- STORY SCHEMA UPDATES (for v2 content)
-- =============================================================================

-- Add category and difficulty columns to stories if not present
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS word_count INTEGER;

-- Add comments
COMMENT ON COLUMN stories.category IS 'Content category: daily_life, health_wellness, workplace_social, travel_adventure, creative_whimsical';
COMMENT ON COLUMN stories.difficulty_level IS 'Progressive difficulty 1-5 (1=Foundation, 5=Expert)';
COMMENT ON COLUMN stories.word_count IS 'Approximate word count for duration estimation';

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_stories_category
ON stories(category);

CREATE INDEX IF NOT EXISTS idx_stories_difficulty
ON stories(difficulty_level);

-- =============================================================================
-- STORY QUESTIONS UPDATES
-- =============================================================================

-- Add question_type if not present
ALTER TABLE story_questions
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'detail';

-- Add comment
COMMENT ON COLUMN story_questions.question_type IS 'Question type: detail, inference, sequence, main_idea';

-- Create index for question type analysis
CREATE INDEX IF NOT EXISTS idx_story_questions_type
ON story_questions(question_type);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check the new columns exist (run these after migration):
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'word_pairs'
-- AND column_name IN ('contrast_category', 'phoneme_1_ipa', 'phoneme_2_ipa', 'contrast_position');

-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'stories'
-- AND column_name IN ('category', 'difficulty_level', 'word_count');
