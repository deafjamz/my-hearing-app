/**
 * Smart Coach Engine — Adaptive Difficulty System
 *
 * Implements a 2-down/1-up adaptive staircase for SNR adjustment.
 * This is SoundSteps' core differentiator — it adapts exercise difficulty
 * to each user's performance in real-time.
 *
 * Spec: docs/rules/10_CLINICAL_CONSTANTS.md
 *
 * Clinical context:
 * - CI users typically need +5 to +15 dB SNR for 80% comprehension
 * - The staircase converges on the user's 70.7% correct threshold
 * - SNR adjustments happen every 10 trials (1 block)
 */

import { supabase } from '@/lib/supabase';

// ── Clinical Constants (from docs/rules/10_CLINICAL_CONSTANTS.md) ──────────

/** SNR step size in dB. Each adjustment moves by this amount. */
export const SNR_STEP = 5;

/** Minimum SNR (hardest condition). Speech barely above noise. */
export const SNR_MIN = -10;

/** Maximum SNR (easiest condition). Speech well above noise. */
export const SNR_MAX = 20;

/** Default starting SNR for new users. Comfortable listening. */
export const SNR_DEFAULT = 10;

/** Number of trials per evaluation block. Coach evaluates after every block. */
export const BLOCK_SIZE = 10;

/** Accuracy threshold to increase difficulty (decrease SNR). */
export const THRESHOLD_UP = 80;

/** Accuracy threshold to decrease difficulty (increase SNR). */
export const THRESHOLD_DOWN = 50;

// ── Types ──────────────────────────────────────────────────────────────────

export interface SmartCoachResponse {
  recommendation: string;
  action: 'increase' | 'decrease' | 'keep';
  accuracy: number;
  next_snr: number;
}

// ── Core Algorithm ─────────────────────────────────────────────────────────

/**
 * Evaluate a block of trials and recommend SNR adjustment.
 *
 * Algorithm (2-down / 1-up staircase):
 *   - ≥80% accuracy (8/10) → Decrease SNR by 5 dB (make harder)
 *   - ≤50% accuracy (5/10) → Increase SNR by 5 dB (make easier)
 *   - 51-79%               → Maintain current SNR
 *
 * SNR is clamped to [SNR_MIN, SNR_MAX] range.
 * This function is pure — no side effects, no async.
 */
export function evaluateSession(
  currentSNR: number,
  results: boolean[]
): SmartCoachResponse {
  const correct = results.filter(Boolean).length;
  const accuracy = (correct / results.length) * 100;

  if (accuracy >= THRESHOLD_UP) {
    const next_snr = Math.max(SNR_MIN, currentSNR - SNR_STEP);
    return {
      recommendation:
        accuracy === 100
          ? 'Perfect score! Increasing the challenge.'
          : `${Math.round(accuracy)}% accuracy — great work! Making it harder.`,
      action: 'decrease',
      accuracy,
      next_snr,
    };
  }

  if (accuracy <= THRESHOLD_DOWN) {
    const next_snr = Math.min(SNR_MAX, currentSNR + SNR_STEP);
    return {
      recommendation: `${Math.round(accuracy)}% accuracy. Adjusting to build confidence.`,
      action: 'increase',
      accuracy,
      next_snr,
    };
  }

  return {
    recommendation: `${Math.round(accuracy)}% accuracy — solid progress. Staying at this level.`,
    action: 'keep',
    accuracy,
    next_snr: currentSNR,
  };
}

// ── Data Access ────────────────────────────────────────────────────────────

/**
 * Get the babble noise URL from Supabase storage.
 * Returns null if no babble asset is found (exercises continue without noise).
 */
export async function getClinicalBabble(): Promise<string | null> {
  const { data, error } = await supabase
    .from('noise_assets')
    .select('storage_url')
    .eq('name', 'babble_6talker_clinical')
    .single();

  if (error || !data) {
    if (import.meta.env.DEV) {
      console.warn('[SmartCoach] No babble noise found:', error?.message);
    }
    return null;
  }

  return data.storage_url;
}

/**
 * Get the user's saved SNR level from their profile.
 * Returns SNR_DEFAULT (+10 dB) if no saved value exists.
 */
export async function getUserSNR(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('profiles')
    .select('current_snr')
    .eq('id', userId)
    .single();

  if (error || data?.current_snr == null) {
    return SNR_DEFAULT;
  }

  return data.current_snr;
}

/**
 * Save the user's current SNR level to their profile.
 * Silently fails if the update errors (non-blocking).
 */
export async function saveUserSNR(userId: string, snr: number): Promise<void> {
  const clamped = Math.max(SNR_MIN, Math.min(SNR_MAX, snr));

  const { error } = await supabase
    .from('profiles')
    .update({ current_snr: clamped })
    .eq('id', userId);

  if (error && import.meta.env.DEV) {
    console.error('[SmartCoach] Failed to save SNR:', error.message);
  }
}
