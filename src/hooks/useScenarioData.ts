import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook to fetch scenario stimuli from v5 schema
 * Multi-speaker dialogue scenarios with context primers
 */

export interface ScenarioStimulus {
  id: string;
  content_text: string;
  clinical_metadata: {
    scenario_id: string;
    environment_type: string;
    difficulty_tier: number;
    context_primer: string;
    background_noise_prompt: string;
    num_turns: number;
    speaker_a_config: string;
    speaker_b_config: string;
    question_text: string;
    correct_answer: string;
    distractor_1: string;  // Acoustic foil
    distractor_2: string;  // Semantic foil
  };
  created_at: string;
}

export interface ScenarioWithAudio extends ScenarioStimulus {
  audio_assets: {
    id: string;
    storage_path: string;
    voice_id: string;
    verified_rms_db: number;
    duration_ms?: number;
  }[];
}

interface UseScenarioDataOptions {
  difficulty_tier?: number;
  environment_type?: string;
  limit?: number;
}

export function useScenarioData(options: UseScenarioDataOptions = {}) {
  const [scenarios, setScenarios] = useState<ScenarioWithAudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScenarios();
  }, [JSON.stringify(options)]);

  const fetchScenarios = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stimuli WHERE content_type = 'scenario'
      let stimuliQuery = supabase
        .from('stimuli_catalog')
        .select('*')
        .eq('content_type', 'scenario');

      // Apply filters on clinical_metadata JSONB
      if (options.difficulty_tier) {
        stimuliQuery = stimuliQuery.eq('clinical_metadata->>difficulty_tier', options.difficulty_tier.toString());
      }
      if (options.environment_type) {
        stimuliQuery = stimuliQuery.eq('clinical_metadata->>environment_type', options.environment_type);
      }
      if (options.limit) {
        stimuliQuery = stimuliQuery.limit(options.limit);
      }

      const { data: stimuliData, error: stimuliError } = await stimuliQuery;

      if (stimuliError) throw stimuliError;
      if (!stimuliData || stimuliData.length === 0) {
        setScenarios([]);
        return;
      }

      // Fetch audio assets for all stimuli (multi-speaker scenarios use voice_id = 'multi')
      const stimuliIds = stimuliData.map((s) => s.id);
      const audioQuery = supabase
        .from('audio_assets')
        .select('*')
        .in('stimuli_id', stimuliIds)
        .eq('voice_id', 'multi');

      const { data: audioData, error: audioError } = await audioQuery;

      if (audioError) throw audioError;

      // Merge stimuli with audio assets
      const scenariosWithAudio: ScenarioWithAudio[] = stimuliData.map((stimulus) => ({
        ...stimulus,
        audio_assets: audioData?.filter((a) => a.stimuli_id === stimulus.id) || [],
      }));

      setScenarios(scenariosWithAudio);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scenarios');
      console.error('Error fetching scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  return { scenarios, loading, error, refetch: fetchScenarios };
}

/**
 * Hook to get a single scenario with audio
 */
export function useScenario(scenarioId: string) {
  const [scenario, setScenario] = useState<ScenarioWithAudio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scenarioId) return;
    fetchScenario();
  }, [scenarioId]);

  const fetchScenario = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch stimulus
      const { data: stimulusData, error: stimulusError } = await supabase
        .from('stimuli_catalog')
        .select('*')
        .eq('id', scenarioId)
        .eq('content_type', 'scenario')
        .single();

      if (stimulusError) throw stimulusError;

      // Fetch audio assets (multi-speaker)
      const { data: audioData, error: audioError } = await supabase
        .from('audio_assets')
        .select('*')
        .eq('stimuli_id', scenarioId)
        .eq('voice_id', 'multi');

      if (audioError) throw audioError;

      setScenario({
        ...stimulusData,
        audio_assets: audioData || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scenario');
      console.error('Error fetching scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  return { scenario, loading, error, refetch: fetchScenario };
}

// Re-export shared audio URL helper for backward compat
export { getStorageUrl as getAudioUrl } from '@/lib/audio';
