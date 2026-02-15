-- Add Story Voice Columns for New 9-Voice System
-- Created: 2026-01-19
-- Purpose: Add audio path columns for bill, michael, alice, daniel, matilda, charlie, aravind
--
-- Run this AFTER generating story audio for new voices
-- The stories table currently only has columns for: sarah, marcus, emma, david

-- Bill (US Male)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS audio_bill_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_bill_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_data_bill JSONB;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS f0_mean_hz_bill NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS verified_rms_bill NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS stoi_score_bill NUMERIC;

-- Michael (US Male)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS audio_michael_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_michael_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_data_michael JSONB;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS f0_mean_hz_michael NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS verified_rms_michael NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS stoi_score_michael NUMERIC;

-- Alice (UK Female)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS audio_alice_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_alice_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_data_alice JSONB;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS f0_mean_hz_alice NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS verified_rms_alice NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS stoi_score_alice NUMERIC;

-- Daniel (UK Male)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS audio_daniel_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_daniel_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_data_daniel JSONB;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS f0_mean_hz_daniel NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS verified_rms_daniel NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS stoi_score_daniel NUMERIC;

-- Matilda (AU Female)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS audio_matilda_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_matilda_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_data_matilda JSONB;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS f0_mean_hz_matilda NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS verified_rms_matilda NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS stoi_score_matilda NUMERIC;

-- Charlie (AU Male)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS audio_charlie_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_charlie_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_data_charlie JSONB;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS f0_mean_hz_charlie NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS verified_rms_charlie NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS stoi_score_charlie NUMERIC;

-- Aravind (IN Male)
ALTER TABLE stories ADD COLUMN IF NOT EXISTS audio_aravind_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_aravind_path TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS alignment_data_aravind JSONB;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS f0_mean_hz_aravind NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS verified_rms_aravind NUMERIC;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS stoi_score_aravind NUMERIC;

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stories'
AND column_name LIKE '%bill%' OR column_name LIKE '%michael%'
OR column_name LIKE '%alice%' OR column_name LIKE '%daniel%'
OR column_name LIKE '%matilda%' OR column_name LIKE '%charlie%'
OR column_name LIKE '%aravind%'
ORDER BY column_name;
