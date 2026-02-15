-- Migration: Enhance Stories Module for Active Comprehension (FIXED v2)
-- Adds phonemic target columns for embedded clinical assessment.

-- Step 1: Add new fields to the existing 'stories' table (safe to re-run)
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS ambience_path TEXT,
ADD COLUMN IF NOT EXISTS phonemic_targets TEXT[]; -- Example: {'p/b', 'k/g'}

-- Step 2: Drop the faulty questions table if it exists
DROP TABLE IF EXISTS story_questions;

-- Step 3: Create a new table for comprehension questions with the CORRECT types and new fields
CREATE TABLE story_questions (
    id TEXT PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,
    answer_options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    difficulty_level INTEGER NOT NULL,
    phonemic_target TEXT, -- Example: 'p/b'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Enable RLS and create read policy for the new table
ALTER TABLE story_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Story Questions" ON story_questions FOR SELECT USING (true);