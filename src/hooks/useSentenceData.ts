import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook to fetch sentence stimuli from v5 schema
 * Erber Level 4: Comprehension
 */

export interface SentenceStimulus {
  id: string;
  content_text: string;
  clinical_metadata: {
    target_keyword: string;
    target_phoneme: string;
    question_text: string;
    correct_answer: string;
    acoustic_foil: string;
    semantic_foil: string;
    scenario: string;
    difficulty: number;
  };
  created_at: string;
}

export interface SentenceWithAudio extends SentenceStimulus {
  audio_assets: {
    id: string;
    storage_path: string;
    voice_id: string;
    verified_rms_db: number;
    duration_ms?: number;
  }[];
}

interface UseSentenceDataOptions {
  difficulty?: number;
  scenario?: string;
  voiceId?: 'sarah' | 'marcus';
  limit?: number;
}

export function useSentenceData(options: UseSentenceDataOptions = {}) {
  const [sentences, setSentences] = useState<SentenceWithAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSentences();
  }, [JSON.stringify(options)]);

  const fetchSentences = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stimuli WHERE content_type = 'sentence'
      let stimuliQuery = supabase
        .from('stimuli_catalog')
        .select('*')
        .eq('content_type', 'sentence');

      // Apply filters on clinical_metadata JSONB
      if (options.difficulty) {
        stimuliQuery = stimuliQuery.eq('clinical_metadata->>difficulty', options.difficulty.toString());
      }
      if (options.scenario) {
        stimuliQuery = stimuliQuery.eq('clinical_metadata->>scenario', options.scenario);
      }
      if (options.limit) {
        stimuliQuery = stimuliQuery.limit(options.limit);
      }

      const { data: stimuliData, error: stimuliError } = await stimuliQuery;

      if (stimuliError) throw stimuliError;
      if (!stimuliData || stimuliData.length === 0) {
        setSentences([]);
        return;
      }

      // Fetch audio assets for all stimuli
      const stimuliIds = stimuliData.map((s) => s.id);
      let audioQuery = supabase
        .from('audio_assets')
        .select('*')
        .in('stimuli_id', stimuliIds);

      // Filter by voice if specified
      if (options.voiceId) {
        audioQuery = audioQuery.eq('voice_id', options.voiceId);
      }

      const { data: audioData, error: audioError } = await audioQuery;

      if (audioError) throw audioError;

      // Merge stimuli with audio assets
      const sentencesWithAudio: SentenceWithAudio[] = stimuliData.map((stimulus) => ({
        ...stimulus,
        audio_assets: audioData?.filter((a) => a.stimuli_id === stimulus.id) || [],
      }));

      setSentences(sentencesWithAudio);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sentences');
      console.error('Error fetching sentences:', err);
    } finally {
      setLoading(false);
    }
  };

  return { sentences, loading, error, refetch: fetchSentences };
}

/**
 * Hook to get a single sentence with audio
 */
export function useSentence(sentenceId: string, voiceId: 'sarah' | 'marcus') {
  const [sentence, setSentence] = useState<SentenceWithAudio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sentenceId) return;
    fetchSentence();
  }, [sentenceId, voiceId]);

  const fetchSentence = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stimulus
      const { data: stimulusData, error: stimulusError } = await supabase
        .from('stimuli_catalog')
        .select('*')
        .eq('id', sentenceId)
        .eq('content_type', 'sentence')
        .single();

      if (stimulusError) throw stimulusError;

      // Fetch audio assets
      const { data: audioData, error: audioError } = await supabase
        .from('audio_assets')
        .select('*')
        .eq('stimuli_id', sentenceId)
        .eq('voice_id', voiceId);

      if (audioError) throw audioError;

      setSentence({
        ...stimulusData,
        audio_assets: audioData || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sentence');
      console.error('Error fetching sentence:', err);
    } finally {
      setLoading(false);
    }
  };

  return { sentence, loading, error, refetch: fetchSentence };
}

/**
 * Generate audio URL from storage path
 */
export function getAudioUrl(storagePath: string): string {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  return `${SUPABASE_URL}/storage/v1/object/public/audio/${storagePath}`;
}
