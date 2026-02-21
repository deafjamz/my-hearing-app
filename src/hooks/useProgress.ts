import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../store/UserContext';
import type { ContentType } from '@/types/database.types';

export interface ProgressPayload {
  contentType: ContentType;
  contentId: string;
  result: 'correct' | 'incorrect' | 'skipped';
  userResponse?: string;
  correctResponse?: string;
  metadata?: {
    targetPhoneme?: string;
    contrastPhoneme?: string;
    voiceId?: string;
    noiseLevel?: string;
    snr?: number;
    clinicalCategory?: string;
    difficulty?: string;
    // Sprint 1: Rich data fields
    activityType?: string;
    trialNumber?: number;
    replayCount?: number;
    voiceGender?: 'male' | 'female';
    tier?: string;
    word?: string;
    hasSound?: boolean;
    distractorWord?: string;
    position?: string;
    vowelContext?: string;
    noiseEnabled?: boolean;
    sentenceText?: string;
    distractors?: string[];
    questionText?: string;
    storyId?: string;
    [key: string]: unknown;
  };
  responseTimeMs?: number;
  sessionId?: string;
}

export function useProgress() {
  const { incrementStreak, resetStreak } = useUser();
  const [isLogging, setIsLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logProgress = async (payload: ProgressPayload) => {
    setIsLogging(true);
    setError(null);
    const timestamp = new Date().toISOString();

    // 1. Optimistic UI Updates for streak
    if (payload.result === 'correct') {
      incrementStreak();
    } else if (payload.result === 'incorrect') {
      resetStreak();
    }

    // 2. Supabase Insert (or localStorage fallback for guests)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Guest mode — save to localStorage so Dashboard can display it
        try {
          const guestTrials = parseInt(localStorage.getItem('guest_total_trials') || '0', 10);
          localStorage.setItem('guest_total_trials', String(guestTrials + 1));

          const guestCorrect = parseInt(localStorage.getItem('guest_correct_trials') || '0', 10);
          if (payload.result === 'correct') {
            localStorage.setItem('guest_correct_trials', String(guestCorrect + 1));
          }

          if (payload.metadata?.snr != null) {
            localStorage.setItem('guest_current_snr', String(payload.metadata.snr));
          }
        } catch { /* localStorage unavailable */ }
        setIsLogging(false);
        return;
      }

      const { error: dbError } = await supabase.from('user_progress').insert({
        user_id: user.id,
        session_id: payload.sessionId,
        content_type: payload.contentType,
        content_id: payload.contentId,
        result: payload.result,
        user_response: payload.userResponse,
        correct_response: payload.correctResponse,
        content_tags: payload.metadata,
        response_time_ms: payload.responseTimeMs,
        listening_condition: payload.metadata?.noiseEnabled ? 'noise' : 'quiet',
        created_at: timestamp
      });

      if (dbError) {
        setError('Progress not saved — try again later');
        if (import.meta.env.DEV) console.error("Failed to log progress:", dbError);
      } else {
        if (import.meta.env.DEV) console.log("Progress logged successfully:", payload);
      }
    } catch (e) {
      setError('Progress not saved — connection error');
      if (import.meta.env.DEV) console.error("Supabase logging error:", e);
    } finally {
      setIsLogging(false);
    }
  };

  const clearError = () => setError(null);

  return { logProgress, isLogging, error, clearError };
}