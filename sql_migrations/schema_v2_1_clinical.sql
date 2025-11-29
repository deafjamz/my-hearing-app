-- Supabase Schema V2.1: Clinical Metadata & Reporting
-- Goal: Support granular tagging for "Smart Coach" algorithms and detailed Clinical Reports.

-- 1. ENUMS for Strict Typing
-- Check if types exist first to avoid errors on re-run (or just ignore errors)
do $$ begin
    create type difficulty_level as enum ('1', '2', '3', '4', '5');
    create type phoneme_position as enum ('initial', 'medial', 'final');
    create type vowel_type as enum ('high', 'low', 'back', 'front', 'diphthong', 'none');
    create type content_tier as enum ('free', 'standard', 'premium');
exception
    when duplicate_object then null;
end $$;

-- 2. Enhanced Word Pairs Table
alter table word_pairs 
  add column if not exists target_phoneme text,        
  add column if not exists contrast_phoneme text,      
  add column if not exists position phoneme_position,  
  add column if not exists vowel_context vowel_type,   
  add column if not exists clinical_category text;
  
-- We perform a safe drop only if you are okay losing the old 'category' data. 
-- Assuming we can re-sync from CSV.
alter table word_pairs drop column if exists category; -- Safe drop

-- 3. New Sentences Table (SPIN / HINT style)
create table if not exists sentences (
  id uuid default uuid_generate_v4() primary key,
  text text not null,
  target_word text,                
  difficulty difficulty_level default '1',
  noise_level text default 'quiet', 
  predictability text default 'high', 
  tier content_tier default 'free',
  audio_sarah_path text,
  audio_marcus_path text,
  audio_emma_path text,
  audio_david_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  constraint unique_sentence_text unique (text)
);

-- 4. Enhanced Scenarios
alter table scenarios
  add column if not exists ambience_path text, 
  add column if not exists duration_seconds integer;

-- 5. User Progress (The "Clinical Evidence" Table)
create table if not exists user_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  session_id uuid, 
  
  content_type text not null, 
  content_id uuid not null,   
  content_tags jsonb,         
  
  result text not null,       
  user_response text,         
  correct_response text,      
  response_time_ms integer,   
  
  listening_condition text,   
  device_volume float,        
  
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Clinical Report View (Aggregation)
create or replace view user_clinical_summary as
select 
  user_id,
  date_trunc('day', created_at) as practice_date,
  count(*) as total_exercises,
  count(*) filter (where result = 'correct') as correct_count,
  round((count(*) filter (where result = 'correct')::decimal / count(*)) * 100, 1) as accuracy_percentage,
  avg(response_time_ms) as avg_reaction_time
from user_progress
group by user_id, date_trunc('day', created_at);

-- RLS (Only for tables)
alter table sentences enable row level security;
alter table user_progress enable row level security;

-- Policies
create policy "Public Read Sentences" on sentences for select using (true);
create policy "Users can insert progress" on user_progress for insert with check (auth.uid() = user_id);
create policy "Users can read own progress" on user_progress for select using (auth.uid() = user_id);