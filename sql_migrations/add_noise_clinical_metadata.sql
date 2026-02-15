-- Add Clinical Metadata to noise_assets Table
-- This enhances the noise_assets table with audiology-specific fields
-- for clinical validation and evidence-based noise classification.

ALTER TABLE noise_assets
  ADD COLUMN IF NOT EXISTS spectral_type TEXT CHECK (spectral_type IN ('babble', 'speech_shaped', 'ambient', 'modulated')),
  ADD COLUMN IF NOT EXISTS temporal_type TEXT CHECK (temporal_type IN ('steady', 'modulated', 'transient')),
  ADD COLUMN IF NOT EXISTS talker_count INTEGER,
  ADD COLUMN IF NOT EXISTS clinical_validated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS masking_type TEXT CHECK (masking_type IN ('energetic', 'informational', 'mixed'));

-- Add comments for clinical context
COMMENT ON COLUMN noise_assets.spectral_type IS 'Frequency characteristics: babble (multi-talker), speech_shaped (LTASS-matched), ambient (environmental), modulated (amplitude-varying)';
COMMENT ON COLUMN noise_assets.temporal_type IS 'Temporal characteristics: steady (continuous), modulated (rhythmic), transient (intermittent events)';
COMMENT ON COLUMN noise_assets.talker_count IS 'Number of talkers in babble (0 for non-speech noise)';
COMMENT ON COLUMN noise_assets.clinical_validated IS 'Whether this noise has been validated by audiologists for clinical use';
COMMENT ON COLUMN noise_assets.masking_type IS 'Type of masking: energetic (spectral overlap), informational (semantic interference), mixed (both)';

-- Create view for clinical noise catalog
CREATE OR REPLACE VIEW noise_clinical_catalog AS
SELECT
  id,
  name,
  description,
  category,
  intensity,
  spectral_type,
  temporal_type,
  talker_count,
  masking_type,
  verified_rms_db,
  duration_ms,
  clinical_validated,
  storage_url,
  tags,
  CASE
    WHEN spectral_type = 'babble' AND talker_count >= 4 THEN 'Gold Standard'
    WHEN spectral_type = 'speech_shaped' AND temporal_type = 'steady' THEN 'Standardized Test'
    WHEN spectral_type = 'ambient' THEN 'Ecological'
    ELSE 'Specialized'
  END as clinical_classification
FROM noise_assets
ORDER BY
  CASE category
    WHEN 'speech_babble' THEN 1
    WHEN 'white_noise' THEN 2
    WHEN 'environmental' THEN 3
    ELSE 4
  END,
  name;

-- Sample query to get noise for specific difficulty level
COMMENT ON VIEW noise_clinical_catalog IS 'Clinical catalog of validated background noise for speech-in-noise training';
