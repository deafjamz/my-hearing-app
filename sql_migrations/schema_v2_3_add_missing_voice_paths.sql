-- Supabase Schema V2.3: Add Missing Voice-Specific Audio/Alignment Paths

-- Add missing audio paths for Emma and David to stories table
alter table stories
  add column if not exists audio_emma_path text,
  add column if not exists audio_david_path text;

-- Add missing alignment paths for all voices to stories table
alter table stories
  add column if not exists alignment_sarah_path text,
  add column if not exists alignment_marcus_path text,
  add column if not exists alignment_emma_path text,
  add column if not exists alignment_david_path text;

-- Add missing alignment paths for all voices to word_pairs table
alter table word_pairs
  add column if not exists alignment_sarah_path text,
  add column if not exists alignment_marcus_path text,
  add column if not exists alignment_emma_path text,
  add column if not exists alignment_david_path text;
