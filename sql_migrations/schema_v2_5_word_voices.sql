-- Supabase Schema V2.5: Add Voice-Specific Audio Paths to Word Pairs

-- Add audio paths for all 4 voices for Word 1
alter table word_pairs
  add column if not exists audio_1_sarah text,
  add column if not exists audio_1_marcus text,
  add column if not exists audio_1_emma text,
  add column if not exists audio_1_david text;

-- Add audio paths for all 4 voices for Word 2
alter table word_pairs
  add column if not exists audio_2_sarah text,
  add column if not exists audio_2_marcus text,
  add column if not exists audio_2_emma text,
  add column if not exists audio_2_david text;
