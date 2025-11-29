# Supabase Setup Guide for SoundSteps

Since we are moving to a "Cloud-First" architecture, we need to set up the backend infrastructure. Follow these steps to initialize your Supabase project.

## 1. Create Project
1.  Go to [database.new](https://database.new) (Supabase).
2.  Sign in with GitHub.
3.  **Organization:** Create one if needed (e.g., "DeafJamz").
4.  **Name:** `soundsteps-prod`.
5.  **Database Password:** Generate a strong one and **save it in your password manager**.
6.  **Region:** Choose one close to your users (e.g., US East).
7.  Click **Create new project**.

## 2. API Keys
Once the project is ready (takes ~2 mins):
1.  Go to **Project Settings** (Cog icon) -> **API**.
2.  Copy the `Project URL`.
3.  Copy the `service_role` secret (reveal it). **WARNING:** Never expose this in the Frontend app. This is for our Python scripts only.
4.  Copy the `anon` public key. This goes in the Frontend app.

**Update your `.env` file locally:**
```bash
SUPABASE_URL="your_project_url"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
SUPABASE_ANON_KEY="your_anon_key"
```

## 3. Database Schema (SQL)
Go to the **SQL Editor** (Sidebar) -> **New Query**. Paste and run this SQL to create the tables:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Word Pairs Table
create table word_pairs (
  id uuid default uuid_generate_v4() primary key,
  word_1 text not null,
  word_2 text not null,
  category text not null, -- e.g., "Vowel Contrast"
  difficulty text default 'easy',
  tier text default 'free', -- free, standard, premium
  audio_1_path text, -- Path in Storage
  audio_2_path text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Stories Table
create table stories (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  transcript text not null,
  tier text default 'free',
  audio_male_path text,
  audio_female_path text,
  alignment_male_path text, -- JSON file path
  alignment_female_path text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Scenarios Table
create table scenarios (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  difficulty text default 'Intermediate',
  tier text default 'free',
  ambience_path text, -- Background noise loop
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Scenario Items (Dialogue lines)
create table scenario_items (
  id uuid default uuid_generate_v4() primary key,
  scenario_id uuid references scenarios(id) on delete cascade,
  speaker text not null, -- e.g., "Barista"
  text text not null,
  audio_path text,
  "order" integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table word_pairs enable row level security;
alter table stories enable row level security;
alter table scenarios enable row level security;
alter table scenario_items enable row level security;

-- Public Read Access (For now - we will add Auth later)
create policy "Public Read Words" on word_pairs for select using (true);
create policy "Public Read Stories" on stories for select using (true);
create policy "Public Read Scenarios" on scenarios for select using (true);
create policy "Public Read Scenario Items" on scenario_items for select using (true);
```

## 4. Storage Buckets
Go to **Storage** (Sidebar) -> **New Bucket**.
1.  **Name:** `audio`
2.  **Public bucket:** ON
3.  Click **Save**.

*Create a second bucket:*
1.  **Name:** `alignment` (for JSON timestamps)
2.  **Public bucket:** ON
3.  Click **Save**.

## 5. Install Python Client
In your terminal, install the library so our scripts can talk to the cloud:
```bash
pip install supabase
```
