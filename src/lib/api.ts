/**
 * Smart Coach API — Local Implementation
 *
 * Implements adaptive SNR adjustment and clinical babble retrieval.
 * All logic runs client-side against Supabase.
 *
 * Clinical SNR Reference:
 * - CI users need +5 to +15 dB for 80% comprehension in noise
 * - Adaptive training reduces SNR as performance improves
 */

import { supabase } from '@/lib/supabase';

export interface SmartCoachResponse {
  recommendation: string;
  action: 'increase' | 'decrease' | 'keep';
  accuracy: number;
  next_snr: number;
}

/**
 * Evaluate a batch of trials and recommend SNR adjustment.
 *
 * Rules (per clinical guidelines):
 * - >=80% accuracy → decrease SNR by 2 dB (make harder)
 * - <=50% accuracy → increase SNR by 2 dB (make easier)
 * - 51-79% → keep current SNR
 *
 * SNR is clamped to [-10, +20] dB range.
 */
export async function evaluateSession(
  currentSNR: number,
  results: boolean[]
): Promise<SmartCoachResponse> {
  const correct = results.filter(Boolean).length;
  const accuracy = (correct / results.length) * 100;

  const SNR_STEP = 2;
  const SNR_MIN = -10;
  const SNR_MAX = 20;

  if (accuracy >= 80) {
    const next_snr = Math.max(SNR_MIN, currentSNR - SNR_STEP);
    return {
      recommendation:
        accuracy === 100
          ? 'Perfect score! Increasing the challenge.'
          : `${accuracy}% accuracy — great work! Making it a bit harder.`,
      action: 'decrease',
      accuracy,
      next_snr,
    };
  }

  if (accuracy <= 50) {
    const next_snr = Math.min(SNR_MAX, currentSNR + SNR_STEP);
    return {
      recommendation: `${accuracy}% accuracy. Dialing back the difficulty so you can build confidence.`,
      action: 'increase',
      accuracy,
      next_snr,
    };
  }

  return {
    recommendation: `${accuracy}% accuracy — solid progress. Staying at this level.`,
    action: 'keep',
    accuracy,
    next_snr: currentSNR,
  };
}

/**
 * Get the clinical babble noise URL from Supabase.
 * Returns null if no babble asset is found.
 */
export async function getClinicalBabble(): Promise<string | null> {
  const { data, error } = await supabase
    .from('noise_assets')
    .select('storage_url')
    .eq('name', 'babble_6talker_clinical')
    .single();

  if (error || !data) {
    console.warn('[api] No clinical babble found:', error?.message);
    return null;
  }

  return data.storage_url;
}

/**
 * Get the user's saved SNR level. Defaults to +10 dB.
 */
export async function getUserSNR(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('current_snr')
    .eq('id', userId)
    .single();

  if (error || !data?.current_snr) {
    return 10; // Default +10 dB (easy starting point)
  }

  return data.current_snr;
}

/**
 * Save the user's current SNR level to their profile.
 */
export async function saveUserSNR(userId: string, snr: number): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ current_snr: snr })
    .eq('id', userId);

  if (error) {
    console.error('[api] Failed to save SNR:', error.message);
  }
}
