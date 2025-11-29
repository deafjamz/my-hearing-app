-- Supabase Schema V2.2: Add Alignment Paths

-- Add alignment paths to stories table
alter table stories
  add column if not exists alignment_sarah_path text,
  add column if not exists alignment_marcus_path text,
  add column if not exists alignment_emma_path text,
  add column if not exists alignment_david_path text;

-- Add alignment paths to word_pairs table (if not already there - good practice to match structure if needed)
alter table word_pairs
  add column if not exists alignment_sarah_path text,
  add column if not exists alignment_marcus_path text,
  add column if not exists alignment_emma_path text,
  add column if not exists alignment_david_path text;
