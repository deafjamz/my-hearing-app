import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getStorageUrl } from '@/lib/audio';
import { applyClinicalMetadataLanguageFilter, normalizeTrainingLanguage, type TrainingLanguage } from '@/lib/trainingLanguage';

export interface DetectionStimulus {
  id: string;
  text: string;
  difficulty: number;
  tier: string;
  blockType: string;
  acousticFocus: string;
  clinicalNote: string;
  audioUrl: string | null;
}

interface UseDetectionDataOptions {
  voiceId: string;
  contentLanguage?: TrainingLanguage;
}

export function useDetectionData(options: UseDetectionDataOptions) {
  const [stimuli, setStimuli] = useState<DetectionStimulus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStimuli();
  }, [options.voiceId, options.contentLanguage]);

  const fetchStimuli = async () => {
    setLoading(true);
    setError(null);

    try {
      const language = normalizeTrainingLanguage(options.contentLanguage);
      const { data: rows, error: rowsError } = await applyClinicalMetadataLanguageFilter(
        supabase
          .from('stimuli_catalog')
          .select('*')
          .eq('content_type', 'sentence')
          .eq('erber_level', 'detection'),
        language
      ).order('difficulty', { ascending: true });

      if (rowsError) throw rowsError;
      if (!rows || rows.length === 0) {
        setStimuli([]);
        return;
      }

      const stimuliIds = rows.map((row) => row.id);
      const { data: audioRows, error: audioError } = await supabase
        .from('audio_assets')
        .select('*')
        .in('stimuli_id', stimuliIds)
        .eq('voice_id', options.voiceId);

      if (audioError) throw audioError;

      setStimuli(rows.map((row) => {
        const meta = typeof row.clinical_metadata === 'string'
          ? JSON.parse(row.clinical_metadata)
          : row.clinical_metadata || {};
        const audio = audioRows?.find((asset) => asset.stimuli_id === row.id);
        return {
          id: row.id,
          text: row.content_text,
          difficulty: row.difficulty || 1,
          tier: row.tier || 'free',
          blockType: meta.block_type || 'speech_token',
          acousticFocus: meta.acoustic_focus || '',
          clinicalNote: meta.clinical_note || '',
          audioUrl: audio?.storage_path ? getStorageUrl(audio.storage_path) : null,
        };
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch detection stimuli');
    } finally {
      setLoading(false);
    }
  };

  return { stimuli, loading, error, refetch: fetchStimuli };
}
