import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  applyClinicalMetadataLanguageFilter,
  normalizeTrainingLanguage,
  type TrainingLanguage,
} from '@/lib/trainingLanguage';

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
    acoustic_foil?: string;
    semantic_foil?: string;
    distractor_1?: string;
    distractor_2?: string;
    distractor_3?: string;
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

type SentenceMetadata = SentenceStimulus['clinical_metadata'];
type RawSentenceRow = SentenceStimulus & {
  training_metadata?: Partial<SentenceMetadata> | null;
  clinical_metadata: Partial<SentenceMetadata> | null;
  difficulty?: number | null;
};

interface UseSentenceDataOptions {
  difficulty?: number;
  scenario?: string;
  voiceId?: string;
  limit?: number;
  contentLanguage?: TrainingLanguage;
}

function normalizeSentenceMetadata(row: RawSentenceRow): SentenceStimulus {
  const training = row.training_metadata || {};
  const clinical = row.clinical_metadata || {};

  return {
    ...row,
    clinical_metadata: {
      target_keyword: clinical.target_keyword || training.target_keyword || '',
      target_phoneme: clinical.target_phoneme || training.target_phoneme || '',
      question_text: clinical.question_text || training.question_text || '',
      correct_answer: clinical.correct_answer || training.correct_answer || '',
      acoustic_foil: clinical.acoustic_foil || training.acoustic_foil,
      semantic_foil: clinical.semantic_foil || training.semantic_foil,
      distractor_1: clinical.distractor_1 || training.distractor_1 || clinical.acoustic_foil || training.acoustic_foil,
      distractor_2: clinical.distractor_2 || training.distractor_2 || clinical.semantic_foil || training.semantic_foil,
      distractor_3: clinical.distractor_3 || training.distractor_3,
      scenario: clinical.scenario || training.scenario || '',
      difficulty: clinical.difficulty || training.difficulty || row.difficulty || 1,
    },
  };
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
      const contentLanguage = normalizeTrainingLanguage(options.contentLanguage);

      // Fetch stimuli WHERE content_type = 'sentence'
      let stimuliQuery = applyClinicalMetadataLanguageFilter(
        supabase
          .from('stimuli_catalog')
          .select('*')
          .eq('content_type', 'sentence'),
        contentLanguage
      );

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
      const sentencesWithAudio: SentenceWithAudio[] = (stimuliData as RawSentenceRow[]).map((stimulus) => ({
        ...normalizeSentenceMetadata(stimulus),
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
export function useSentence(sentenceId: string, voiceId: string, contentLanguage: TrainingLanguage = 'en') {
  const [sentence, setSentence] = useState<SentenceWithAudio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sentenceId) return;
    fetchSentence();
  }, [sentenceId, voiceId, contentLanguage]);

  const fetchSentence = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stimulus
      const { data: stimulusData, error: stimulusError } = await applyClinicalMetadataLanguageFilter(
        supabase
          .from('stimuli_catalog')
          .select('*')
          .eq('id', sentenceId)
          .eq('content_type', 'sentence'),
        normalizeTrainingLanguage(contentLanguage)
      ).single();

      if (stimulusError) throw stimulusError;

      // Fetch audio assets
      const { data: audioData, error: audioError } = await supabase
        .from('audio_assets')
        .select('*')
        .eq('stimuli_id', sentenceId)
        .eq('voice_id', voiceId);

      if (audioError) throw audioError;

      setSentence({
        ...normalizeSentenceMetadata(stimulusData as RawSentenceRow),
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

// Re-export shared audio URL helper for backward compat
export { getStorageUrl as getAudioUrl } from '@/lib/audio';
