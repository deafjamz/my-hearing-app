-- Performance indexes for faster activity loading
-- Run in Supabase SQL Editor after deploy

-- Index for stimuli_catalog content_type filter (CategoryPlayer, CategoryLibrary)
CREATE INDEX IF NOT EXISTS idx_stimuli_catalog_content_type
  ON stimuli_catalog(content_type);

-- Index for server-side category filter in CategoryPlayer
CREATE INDEX IF NOT EXISTS idx_stimuli_catalog_contrast_category
  ON stimuli_catalog((clinical_metadata->>'contrast_category'))
  WHERE content_type = 'word_pair';

-- Index for audio_assets join on stimuli_id
CREATE INDEX IF NOT EXISTS idx_audio_assets_stimuli_id
  ON audio_assets(stimuli_id);

-- Index for word_pairs tier filter
CREATE INDEX IF NOT EXISTS idx_word_pairs_tier
  ON word_pairs(tier);
