-- Supabase Schema V2.4: Add Explicit Audio Paths for Sarah and Marcus

alter table stories
  add column if not exists audio_sarah_path text,
  add column if not exists audio_marcus_path text;
  
-- Optional: Copy legacy data to new columns if we want to preserve it, though link_audio_paths will overwrite
-- update stories set audio_sarah_path = audio_female_path where audio_sarah_path is null;
-- update stories set audio_marcus_path = audio_male_path where audio_marcus_path is null;
