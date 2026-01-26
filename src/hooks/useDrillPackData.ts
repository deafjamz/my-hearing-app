import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useVoice } from '../store/VoiceContext';
import type { StimulusCatalog, DrillPackSummary } from '../types/database.types';

export interface DrillPair {
  id: string;
  word1: string;
  word2: string;
  targetPhoneme: string;
  contrastPhoneme: string;
  position: 'initial' | 'medial' | 'final';
  packId: string;
  packName: string;
  contrastType: string;
  difficulty: number;
  tier: string;
  ipa1: string;
  ipa2: string;
  clinicalNote: string;
  word1AudioUrl: string | null;
  word2AudioUrl: string | null;
}

interface UseDrillPackDataReturn {
  drillPairs: DrillPair[];
  packs: DrillPackSummary[];
  loading: boolean;
  error: string | null;
  fetchByPack: (packId: string) => Promise<void>;
  fetchAll: () => Promise<void>;
  getRandomPair: (packId?: string) => DrillPair | null;
  getPackProgress: (packId: string) => { total: number; completed: number };
  getAudioUrl: (drillId: string, packId: string, word: string) => string;
}

export function useDrillPackData(): UseDrillPackDataReturn {
  const { selectedVoice } = useVoice();
  const [drillPairs, setDrillPairs] = useState<DrillPair[]>([]);
  const [packs, setPacks] = useState<DrillPackSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAudioUrl = useCallback((drillId: string, packId: string, word: string): string => {
    const voiceName = selectedVoice?.name || 'sarah';
    const path = `drills/${voiceName}/${packId}/${drillId}_${word}.mp3`;
    const { data } = supabase.storage.from('audio').getPublicUrl(path);
    return data.publicUrl;
  }, [selectedVoice]);

  const transformRow = useCallback((row: StimulusCatalog): DrillPair => {
    const tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || {};
    const packId = row.drill_pack_id || '';
    const word1 = row.text;
    const word2 = row.text_alt || '';

    return {
      id: row.id,
      word1,
      word2,
      targetPhoneme: row.target_phoneme || '',
      contrastPhoneme: row.contrast_phoneme || '',
      position: (row.phoneme_position as 'initial' | 'medial' | 'final') || 'initial',
      packId,
      packName: tags.pack_name || '',
      contrastType: tags.contrast_type || '',
      difficulty: row.difficulty || 2,
      tier: row.tier,
      ipa1: tags.ipa_1 || '',
      ipa2: tags.ipa_2 || '',
      clinicalNote: tags.clinical_note || '',
      word1AudioUrl: getAudioUrl(row.id, packId, word1),
      word2AudioUrl: getAudioUrl(row.id, packId, word2),
    };
  }, [getAudioUrl]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('stimuli_catalog')
        .select('*')
        .eq('type', 'phoneme_drill')
        .order('drill_pack_id', { ascending: true })
        .order('difficulty', { ascending: true });

      if (queryError) throw queryError;

      const transformed = (data || []).map(transformRow);
      setDrillPairs(transformed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch drill pairs');
    } finally {
      setLoading(false);
    }
  }, [transformRow]);

  const fetchByPack = useCallback(async (packId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('stimuli_catalog')
        .select('*')
        .eq('type', 'phoneme_drill')
        .eq('drill_pack_id', packId)
        .order('difficulty', { ascending: true });

      if (queryError) throw queryError;

      const transformed = (data || []).map(transformRow);
      setDrillPairs(transformed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch drill pairs');
    } finally {
      setLoading(false);
    }
  }, [transformRow]);

  const fetchPacks = useCallback(async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('drill_pack_summary')
        .select('*');

      if (queryError) {
        // Fallback: manually aggregate if view doesn't exist
        console.warn('drill_pack_summary view not available, using fallback');

        const { data: fallbackData } = await supabase
          .from('stimuli_catalog')
          .select('drill_pack_id, target_phoneme, contrast_phoneme, tags, difficulty')
          .eq('type', 'phoneme_drill');

        if (fallbackData) {
          const packMap = new Map<string, DrillPackSummary>();
          for (const row of fallbackData) {
            const packId = row.drill_pack_id;
            if (!packId) continue;

            const tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || {};

            if (!packMap.has(packId)) {
              packMap.set(packId, {
                drill_pack_id: packId,
                pack_name: tags.pack_name || packId,
                contrast_type: tags.contrast_type || '',
                target_phoneme: row.target_phoneme || '',
                contrast_phoneme: row.contrast_phoneme || '',
                total_pairs: 0,
                min_difficulty: row.difficulty || 1,
                max_difficulty: row.difficulty || 1,
                tier: 'free',
              });
            }

            const pack = packMap.get(packId)!;
            pack.total_pairs++;
            pack.min_difficulty = Math.min(pack.min_difficulty, row.difficulty || 1);
            pack.max_difficulty = Math.max(pack.max_difficulty, row.difficulty || 1);
          }

          setPacks(Array.from(packMap.values()));
        }
        return;
      }

      setPacks(data || []);
    } catch (e) {
      console.warn('Failed to fetch drill packs:', e);
    }
  }, []);

  const getRandomPair = useCallback((packId?: string): DrillPair | null => {
    let pool = drillPairs;
    if (packId) {
      pool = drillPairs.filter(p => p.packId === packId);
    }
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [drillPairs]);

  const getPackProgress = useCallback((packId: string): { total: number; completed: number } => {
    const pack = packs.find(p => p.drill_pack_id === packId);
    // TODO: Integrate with user_progress to get actual completion
    return {
      total: pack?.total_pairs || 0,
      completed: 0, // Placeholder - implement with user progress
    };
  }, [packs]);

  useEffect(() => {
    fetchPacks();
  }, [fetchPacks]);

  return {
    drillPairs,
    packs,
    loading,
    error,
    fetchByPack,
    fetchAll,
    getRandomPair,
    getPackProgress,
    getAudioUrl,
  };
}
