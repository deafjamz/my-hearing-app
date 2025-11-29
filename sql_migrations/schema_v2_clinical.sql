-- Supabase Schema V2: Clinical Metadata
-- Goal: Support granular tagging for "Smart Coach" algorithms and detailed analytics.

-- 1. ENUMS for Strict Typing
create type difficulty_level as enum ('1', '2', '3', '4', '5'); -- 1=Easy, 5=Hard
create type phoneme_position as enum ('initial', 'medial', 'final');
create type vowel_type as enum ('high', 'low', 'back', 'front', 'diphthong', 'none');
create type content_tier as enum ('free', 'standard', 'premium');

-- 2. Enhanced Word Pairs Table
-- Replaces simple 'category' with detailed acoustic features
alter table word_pairs 
  add column if not exists target_phoneme text,        -- e.g., "b"
  add column if not exists contrast_phoneme text,      -- e.g., "p"
  add column if not exists position phoneme_position,  -- e.g., "initial"
  add column if not exists vowel_context vowel_type,   -- e.g., "high"
  add column if not exists clinical_category text,     -- e.g., "Manner of Articulation" (High level grouping)
  drop column if exists category; -- Dropping the old simple string column

-- 3. New Sentences Table (SPIN / HINT style)
create table if not exists sentences (
  id uuid default uuid_generate_v4() primary key,
  text text not null,
  target_word text,                -- The key word to identify
  difficulty difficulty_level default '1',
  noise_level text default 'quiet', -- 'quiet', '+10dB', '+5dB', '0dB'
  predictability text default 'high', -- 'high' (context cues) vs 'low' (random context)
  tier content_tier default 'free',
  audio_sarah_path text,
  audio_marcus_path text,
  audio_emma_path text,
  audio_david_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- Constraints
  constraint unique_sentence_text unique (text)
);

-- 4. Enhanced Scenarios (Soundscapes)
-- Scenarios need separate tracks for Speech vs Ambience to allow Client-side Mixing
alter table scenarios
  add column if not exists ambience_path text, -- The background loop (e.g., "cafe_noise.mp3")
  add column if not exists duration_seconds integer;

-- 5. User Progress (The "Smart Coach" Memory)
create table if not exists user_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  content_type text not null, -- 'word', 'sentence', 'story', 'scenario'
  content_id uuid not null,   -- generic reference
  result text not null,       -- 'correct', 'incorrect'
  response_time_ms integer,   -- How fast did they answer?
  practiced_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS for new tables
alter table sentences enable row level security;
alter table user_progress enable row level security;

-- Policies
create policy "Public Read Sentences" on sentences for select using (true);
create policy "Users can insert progress" on user_progress for insert with check (auth.uid() = user_id);
create policy "Users can read own progress" on user_progress for select using (auth.uid() = user_id);
