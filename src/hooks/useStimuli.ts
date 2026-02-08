import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook to fetch stimuli from the new v5 schema
 * Replaces direct imports of wordPairs.ts, sentences.ts, etc.
 */

export interface Stimulus {
  id: string;
  type: 'word' | 'sentence' | 'story' | 'scenario';
  text: string;
  text_alt?: string; // For word pairs
  erber_level?: 'detection' | 'discrimination' | 'identification' | 'comprehension';
  difficulty: number; // 1-5
  target_phoneme?: string;
  contrast_phoneme?: string;
  phoneme_position?: 'initial' | 'medial' | 'final';
  tags?: Record<string, string | number | boolean | null>;
  tier: 'free' | 'standard' | 'premium';
  created_at: string;
}

export interface AudioAsset {
  id: string;
  stimulus_id: string;
  voice_name: string;
  voice_gender: 'male' | 'female';
  storage_url: string;
  verified_rms_db: number;
  duration_ms?: number;
  stoi_score?: number;
  intelligibility_pass: boolean;
}

interface UseStimuliOptions {
  type?: Stimulus['type'];
  tier?: Stimulus['tier'];
  difficulty?: number;
  erber_level?: Stimulus['erber_level'];
  limit?: number;
}

export function useStimuli(options: UseStimuliOptions = {}) {
  const [stimuli, setStimuli] = useState<Stimulus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStimuli();
  }, [JSON.stringify(options)]);

  const fetchStimuli = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('stimuli_catalog').select('*');

      // Apply filters
      if (options.type) {
        query = query.eq('type', options.type);
      }
      if (options.tier) {
        query = query.eq('tier', options.tier);
      }
      if (options.difficulty) {
        query = query.eq('difficulty', options.difficulty);
      }
      if (options.erber_level) {
        query = query.eq('erber_level', options.erber_level);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setStimuli(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stimuli');
    } finally {
      setLoading(false);
    }
  };

  return { stimuli, loading, error, refetch: fetchStimuli };
}

/**
 * Hook to fetch audio assets for a stimulus
 */
export function useAudioAssets(stimulusId: string, voiceName?: string) {
  const [assets, setAssets] = useState<AudioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stimulusId) return;
    fetchAudioAssets();
  }, [stimulusId, voiceName]);

  const fetchAudioAssets = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('audio_assets')
        .select('*')
        .eq('stimulus_id', stimulusId);

      if (voiceName) {
        query = query.eq('voice_name', voiceName);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAssets(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audio assets');
    } finally {
      setLoading(false);
    }
  };

  return { assets, loading, error, refetch: fetchAudioAssets };
}

/**
 * Hook to get a single stimulus with its audio assets
 */
export function useStimulusWithAudio(stimulusId: string, voiceName: string) {
  const [stimulus, setStimulus] = useState<Stimulus | null>(null);
  const [audioAssets, setAudioAssets] = useState<AudioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stimulusId) return;
    fetchData();
  }, [stimulusId, voiceName]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stimulus
      const { data: stimData, error: stimError } = await supabase
        .from('stimuli_catalog')
        .select('*')
        .eq('id', stimulusId)
        .single();

      if (stimError) throw stimError;

      setStimulus(stimData);

      // Fetch audio assets
      const { data: audioData, error: audioError } = await supabase
        .from('audio_assets')
        .select('*')
        .eq('stimulus_id', stimulusId)
        .eq('voice_name', voiceName);

      if (audioError) throw audioError;

      setAudioAssets(audioData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stimulus data');
    } finally {
      setLoading(false);
    }
  };

  return { stimulus, audioAssets, loading, error, refetch: fetchData };
}

/**
 * Hook to log user trials
 */
export function useTrialLogger() {
  const [logging, setLogging] = useState(false);

  const logTrial = async (trial: {
    session_id: string;
    stimulus_id: string;
    condition_snr?: number;
    condition_noise_type?: string;
    user_response: string;
    correct_response: string;
    is_correct: boolean;
    reaction_time_ms: number;
    device_volume?: number;
    device_type?: string;
  }) => {
    setLogging(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase.from('user_trials').insert({
        user_id: userData.user.id,
        ...trial,
      });

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Failed to log trial:', err);
      return false;
    } finally {
      setLogging(false);
    }
  };

  return { logTrial, logging };
}

