-- Add current_snr column to profiles table for Smart Coach persistence
-- This stores the user's current SNR level so they resume at the right difficulty

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_snr INTEGER DEFAULT 10 CHECK (current_snr >= -10 AND current_snr <= 20);

COMMENT ON COLUMN profiles.current_snr IS 'User''s current SNR level for adaptive difficulty (-10 to +20 dB). Default: +10 dB (easy).';
