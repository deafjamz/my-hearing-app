-- Migration: Enhance Stories Module for Active Comprehension
-- Adds a table for story questions and enhances the stories table.

-- Step 1: Add new fields to the existing 'stories' table
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS ambience_path TEXT; -- For background noise

-- Step 2: Create a new table for comprehension questions
CREATE TABLE IF NOT EXISTS story_questions (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL, -- 'gist', 'detail', 'sequence', 'inference'
    answer_options JSONB NOT NULL, -- Example: '["Red", "Blue", "Green"]'
    correct_answer TEXT NOT NULL,
    difficulty_level INTEGER NOT NULL, -- 1 for easy, 2 for medium, 3 for hard
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable RLS and create read policy for the new table
ALTER TABLE story_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Story Questions" ON story_questions FOR SELECT USING (true);
