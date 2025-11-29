import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../store/UserContext';

export interface ProgressPayload {
  contentType: 'word' | 'story' | 'sentence' | 'scenario';
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
  };
  responseTimeMs?: number;
  sessionId?: string;
}

export function useProgress() {
  const { incrementStreak, resetStreak } = useUser();
  const [isLogging, setIsLogging] = useState(false);

  const logProgress = async (payload: ProgressPayload) => {
    setIsLogging(true);
    const timestamp = new Date().toISOString();

    // 1. Optimistic UI Updates for streak
    if (payload.result === 'correct') {
      incrementStreak();
    } else if (payload.result === 'incorrect') {
      resetStreak();
    }
    // Note: addToHistory is no longer called here. It's handled by the session timer.

    // 2. Supabase Insert
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("User not authenticated. Progress not logged to DB.");
        return; 
      }

      const { error } = await supabase.from('user_progress').insert({
        user_id: user.id,
        session_id: payload.sessionId,
        content_type: payload.contentType,
        content_id: payload.contentId,
        result: payload.result,
        user_response: payload.userResponse,
        correct_response: payload.correctResponse,
        content_tags: payload.metadata,
        response_time_ms: payload.responseTimeMs,
        listening_condition: payload.metadata?.noiseLevel || 'quiet',
        created_at: timestamp
      });

      if (error) {
        console.error("Failed to log progress to Supabase:", error);
      } else {
        console.log("✅ Progress logged successfully:", payload);
      }
    } catch (e) {
      console.error("Supabase authentication or logging error:", e);
    } finally {
      setIsLogging(false);
    }
  };

  return { logProgress, isLogging };
}