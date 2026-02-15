-- Migration: Core Docs Alignment (v5)
-- Aligns database schema with core docs/1_TECH_SPEC.md and core docs/2_DATA_SPEC.md
-- Implements: profiles, stimuli_catalog, audio_assets, user_trials

-- =============================================================================
-- 1. PROFILES TABLE
-- Extends auth.users with subscription and clinical data
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'standard', 'premium')),
  audiogram_data JSONB, -- Store audiogram frequencies/thresholds as JSON
  device_type TEXT, -- 'cochlear_implant', 'hearing_aid', 'none'
  implant_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 2. STIMULI_CATALOG TABLE
-- Master list of all content (Erber's Hierarchy)
-- Replaces/consolidates word_pairs, sentences, stories
-- =============================================================================
CREATE TABLE IF NOT EXISTS stimuli_catalog (
  id TEXT PRIMARY KEY, -- Use TEXT for CSV compatibility
  type TEXT NOT NULL CHECK (type IN ('word', 'sentence', 'story', 'scenario')),

  -- Content
  text TEXT NOT NULL,
  text_alt TEXT, -- For word pairs: second word

  -- Clinical Metadata (Erber's Hierarchy)
  erber_level TEXT CHECK (erber_level IN ('detection', 'discrimination', 'identification', 'comprehension')),
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  target_phoneme TEXT,
  contrast_phoneme TEXT,
  phoneme_position TEXT CHECK (phoneme_position IN ('initial', 'medial', 'final')),

  -- Tags for Smart Coach
  tags JSONB,

  -- Access Control
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'standard', 'premium')),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 3. AUDIO_ASSETS TABLE
-- Links stimuli to physical audio files with verified RMS for SNR mixing
-- =============================================================================
CREATE TABLE IF NOT EXISTS audio_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Link to stimulus
  stimulus_id TEXT REFERENCES stimuli_catalog(id) ON DELETE CASCADE,

  -- Voice/Speaker
  voice_name TEXT NOT NULL, -- 'david', 'marcus', 'sarah', 'emma'
  voice_gender TEXT CHECK (voice_gender IN ('male', 'female')),

  -- Storage
  storage_url TEXT NOT NULL UNIQUE, -- Supabase Storage public URL
  storage_bucket TEXT DEFAULT 'audio',
  storage_path TEXT NOT NULL,

  -- CRITICAL: Verified RMS for Client-Side SNR Mixing
  verified_rms_db FLOAT NOT NULL DEFAULT -20.0, -- Phase 3: Python verification
  duration_ms INTEGER,

  -- Quality Metrics (Phase 3: pystoi)
  stoi_score FLOAT CHECK (stoi_score BETWEEN 0 AND 1),
  intelligibility_pass BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

  -- Indexes
  CONSTRAINT unique_stimulus_voice UNIQUE (stimulus_id, voice_name)
);

-- Create index for faster lookups by storage_url (used by SNRMixer)
CREATE INDEX IF NOT EXISTS idx_audio_assets_storage_url ON audio_assets(storage_url);

-- =============================================================================
-- 4. USER_TRIALS TABLE
-- Immutable log of every interaction (The "Clinical Evidence")
-- Implements Smart Coach DDA (Dynamic Difficulty Adaptation)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_trials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- User & Session
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID, -- Group trials by session

  -- Content
  stimulus_id TEXT REFERENCES stimuli_catalog(id),

  -- Listening Condition (CRITICAL for SNR analysis)
  condition_snr INTEGER, -- Signal-to-Noise Ratio in dB (e.g., +10, 0, -5)
  condition_noise_type TEXT, -- 'speech_babble', 'cafeteria', 'quiet'

  -- User Response
  user_response TEXT,
  correct_response TEXT,
  is_correct BOOLEAN,

  -- Performance Metrics
  reaction_time_ms INTEGER,

  -- Device Context
  device_volume FLOAT,
  device_type TEXT,

  -- Timestamp (Immutable)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for Smart Coach queries
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id ON user_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trials_created_at ON user_trials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_trials_session_id ON user_trials(session_id);

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Profiles: Users can only access their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Stimuli Catalog: Public read (content is not user-specific)
ALTER TABLE stimuli_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read stimuli" ON stimuli_catalog
  FOR SELECT USING (true);

-- Audio Assets: Public read (needed for playback)
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read audio assets" ON audio_assets
  FOR SELECT USING (true);

-- User Trials: Users can only insert/read their own trials
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own trials" ON user_trials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own trials" ON user_trials
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- 6. MATERIALIZED VIEW: Smart Coach Analytics
-- Pre-aggregates last 10 trials for DDA algorithm
-- =============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS smart_coach_metrics AS
SELECT
  user_id,
  stimulus_id,
  condition_snr,

  -- Rolling window of last 10 trials
  COUNT(*) OVER (
    PARTITION BY user_id, stimulus_id
    ORDER BY created_at DESC
    ROWS BETWEEN 9 PRECEDING AND CURRENT ROW
  ) as trial_count,

  -- Accuracy in last 10 trials
  AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) OVER (
    PARTITION BY user_id, stimulus_id
    ORDER BY created_at DESC
    ROWS BETWEEN 9 PRECEDING AND CURRENT ROW
  ) * 100 as accuracy_last_10,

  created_at
FROM user_trials;

-- Refresh strategy: Call `REFRESH MATERIALIZED VIEW smart_coach_metrics;`
-- after each session or via Supabase Edge Function

-- =============================================================================
-- 7. FUNCTIONS: Smart Coach DDA
-- 2-down / 1-up Adaptive Staircase
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_next_snr(
  p_user_id UUID,
  p_current_snr INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_accuracy FLOAT;
BEGIN
  -- Get accuracy from last 10 trials
  SELECT accuracy_last_10 INTO v_accuracy
  FROM smart_coach_metrics
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to current SNR if no data
  IF v_accuracy IS NULL THEN
    RETURN p_current_snr;
  END IF;

  -- DDA Logic (from core docs/2_DATA_SPEC.md)
  IF v_accuracy > 85 THEN
    -- Too easy: Decrease SNR (more noise)
    RETURN p_current_snr - 3;
  ELSIF v_accuracy < 60 THEN
    -- Too hard: Increase SNR (less noise)
    RETURN p_current_snr + 3;
  ELSE
    -- Just right: maintain current SNR
    RETURN p_current_snr;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. TRIGGERS: Auto-update timestamps
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- NOTES
-- =============================================================================
-- This migration does NOT drop existing tables (word_pairs, sentences, stories).
-- Those can be migrated to stimuli_catalog via a separate data migration script.
--
-- Next Steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Create data migration script to populate stimuli_catalog from existing tables
-- 3. Update Python pipeline to write to audio_assets with verified_rms_db
-- 4. Update frontend to use new schema
