-- Minimal Schema v5: ElevenLabs-Optimized for Word Pairs
-- Step 1: Get word pairs working end-to-end with full ElevenLabs metadata

-- =============================================================================
-- 1. STIMULI_CATALOG (Minimal - Word Pairs Only)
-- =============================================================================
CREATE TABLE IF NOT EXISTS stimuli_catalog (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('word', 'sentence', 'story', 'scenario')),

  -- Content
  text TEXT NOT NULL,
  text_alt TEXT, -- For word pairs: second word

  -- Clinical Metadata (Simplified for now)
  difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5) DEFAULT 3,
  target_phoneme TEXT,

  -- Access Control
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'standard', 'premium')),

  -- Tags (JSONB for flexibility)
  tags JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 2. AUDIO_ASSETS (ElevenLabs-Enhanced)
-- =============================================================================
CREATE TABLE IF NOT EXISTS audio_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Link to stimulus
  stimulus_id TEXT REFERENCES stimuli_catalog(id) ON DELETE CASCADE,

  -- Voice Information
  voice_name TEXT NOT NULL, -- 'david', 'marcus', 'sarah', 'emma'
  voice_gender TEXT CHECK (voice_gender IN ('male', 'female')),

  -- ElevenLabs Voice ID (for regeneration)
  elevenlabs_voice_id TEXT,

  -- Storage
  storage_url TEXT NOT NULL UNIQUE,
  storage_bucket TEXT DEFAULT 'audio',
  storage_path TEXT NOT NULL,

  -- ===== CRITICAL: Verified RMS for SNR Mixing =====
  verified_rms_db FLOAT NOT NULL DEFAULT -20.0,
  duration_ms INTEGER,

  -- ===== ElevenLabs Quality Metrics =====
  -- F0 (Fundamental Frequency) - Critical for CI users
  f0_mean_hz FLOAT, -- e.g., 118.4 for David, 171.6 for Sarah
  f0_range_hz FLOAT,

  -- Voice Quality (from clinical analysis)
  jitter FLOAT,     -- Pitch variability
  shimmer FLOAT,    -- Amplitude variability
  hnr_db FLOAT,     -- Harmonics-to-Noise Ratio
  voiced_fraction FLOAT, -- % of frames that are voiced

  -- Intelligibility (pystoi)
  stoi_score FLOAT CHECK (stoi_score BETWEEN 0 AND 1),
  intelligibility_pass BOOLEAN DEFAULT true,

  -- ===== ElevenLabs Forced Alignment =====
  -- Stores word-level timestamps for karaoke mode
  alignment_data JSONB, -- Format: {"words": [{"word": "hello", "start": 0.0, "end": 0.5}, ...]}
  alignment_url TEXT, -- Optional: Link to alignment JSON in storage

  -- ElevenLabs Generation Metadata
  elevenlabs_model TEXT DEFAULT 'eleven_multilingual_v2',
  elevenlabs_stability FLOAT,
  elevenlabs_similarity_boost FLOAT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

  -- Performance Indexes
  CONSTRAINT unique_stimulus_voice UNIQUE (stimulus_id, voice_name)
);

-- Create index for faster lookups by storage_url (used by SNRMixer)
CREATE INDEX IF NOT EXISTS idx_audio_assets_storage_url ON audio_assets(storage_url);
CREATE INDEX IF NOT EXISTS idx_audio_assets_voice_name ON audio_assets(voice_name);

-- =============================================================================
-- 3. NOISE_ASSETS (ElevenLabs Sound Effects)
-- =============================================================================
CREATE TABLE IF NOT EXISTS noise_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Noise Identification
  name TEXT NOT NULL UNIQUE, -- 'cafeteria_moderate', 'restaurant_busy', 'street_traffic'
  description TEXT,

  -- Noise Type
  category TEXT CHECK (category IN ('speech_babble', 'environmental', 'white_noise', 'pink_noise')),
  intensity TEXT CHECK (intensity IN ('quiet', 'moderate', 'loud')),

  -- Storage
  storage_url TEXT NOT NULL UNIQUE,
  storage_bucket TEXT DEFAULT 'noise',
  storage_path TEXT NOT NULL,

  -- Audio Characteristics
  verified_rms_db FLOAT DEFAULT -20.0, -- Noise level (for mixing)
  duration_ms INTEGER,
  loop_compatible BOOLEAN DEFAULT false, -- Can be looped seamlessly?

  -- ElevenLabs Generation (if generated via Sound Effects API)
  elevenlabs_generated BOOLEAN DEFAULT false,
  elevenlabs_prompt TEXT, -- Prompt used to generate

  -- Tags
  tags JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 4. ROW LEVEL SECURITY
-- =============================================================================

-- Stimuli Catalog: Public read
ALTER TABLE stimuli_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stimuli" ON stimuli_catalog
  FOR SELECT USING (true);

-- Audio Assets: Public read
ALTER TABLE audio_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read audio assets" ON audio_assets
  FOR SELECT USING (true);

-- Noise Assets: Public read
ALTER TABLE noise_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read noise assets" ON noise_assets
  FOR SELECT USING (true);

-- =============================================================================
-- 5. HELPER VIEWS
-- =============================================================================

-- View: Audio assets with voice quality metrics
CREATE OR REPLACE VIEW audio_quality_report AS
SELECT
  a.stimulus_id,
  a.voice_name,
  a.voice_gender,
  s.text,
  a.f0_mean_hz,
  a.hnr_db,
  a.stoi_score,
  a.intelligibility_pass,
  CASE
    WHEN a.voice_gender = 'male' AND a.f0_mean_hz BETWEEN 85 AND 180 THEN 'Optimal'
    WHEN a.voice_gender = 'female' AND a.f0_mean_hz BETWEEN 165 AND 265 THEN 'Optimal'
    ELSE 'Suboptimal'
  END as ci_suitability
FROM audio_assets a
JOIN stimuli_catalog s ON a.stimulus_id = s.id
WHERE a.f0_mean_hz IS NOT NULL;

-- =============================================================================
-- NOTES FOR STEP 1
-- =============================================================================
-- This minimal schema includes:
-- ✅ stimuli_catalog - Content table
-- ✅ audio_assets - With ElevenLabs metadata (F0, quality, alignment)
-- ✅ noise_assets - For ambient noise (Sound Effects API)
-- ✅ Quality view - CI suitability analysis
--
-- NOT included yet (coming in later steps):
-- ❌ user_trials - Trial logging (Step 2)
-- ❌ profiles - User profiles (Step 3)
-- ❌ Smart Coach functions (Step 4)
--
-- Next: Run migration script to populate with word pairs + voice metadata
