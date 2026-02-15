-- Migration: Final Primary Key Standardization
-- Aligns all content table primary keys to TEXT for compatibility with CSV-based content management.

-- Step 1: Drop the existing foreign key constraint that depends on the UUID type.
ALTER TABLE story_questions DROP CONSTRAINT IF EXISTS story_questions_story_id_fkey;

-- Step 2: Alter the primary key of the 'stories' table to TEXT.
ALTER TABLE stories
ALTER COLUMN id SET DATA TYPE TEXT;

-- Step 3: Alter the referencing column in 'story_questions' to TEXT.
ALTER TABLE story_questions
ALTER COLUMN story_id SET DATA TYPE TEXT;

-- Step 4: Re-establish the foreign key constraint with matching TEXT types.
ALTER TABLE story_questions
ADD CONSTRAINT story_questions_story_id_fkey
FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;
