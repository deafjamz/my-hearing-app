import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { StimulusCatalog, EnvironmentalSoundCategory } from '../types/database.types';

export interface EnvironmentalSound {
  id: string;
  name: string;
  description: string;
  correctAnswer: string;
  category: string;
  intensity: string;
  difficulty: number;
  tier: string;
  foils: string[];
  acousticSimilarity: string;
  safetyCritical: boolean;
  audioUrl: string | null;
}

interface UseEnvironmentalDataReturn {
  sounds: EnvironmentalSound[];
  categories: EnvironmentalSoundCategory[];
  loading: boolean;
  error: string | null;
  fetchByCategory: (category: string) => Promise<void>;
  fetchAll: () => Promise<void>;
  fetchSafetyCritical: () => Promise<void>;
  getRandomSound: (category?: string) => EnvironmentalSound | null;
  getAudioUrl: (soundId: string, category: string) => string;
}

export function useEnvironmentalData(): UseEnvironmentalDataReturn {
  const [sounds, setSounds] = useState<EnvironmentalSound[]>([]);
  const [categories, setCategories] = useState<EnvironmentalSoundCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAudioUrl = useCallback((soundId: string, category: string): string => {
    const path = `environmental/${category}/${soundId}.mp3`;
    const { data } = supabase.storage.from('audio').getPublicUrl(path);
    return data.publicUrl;
  }, []);

  const transformRow = useCallback((row: StimulusCatalog): EnvironmentalSound => {
    const tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || {};

    return {
      id: row.id,
      name: tags.name || row.text,
      description: tags.description || '',
      correctAnswer: row.text,
      category: tags.category || 'general',
      intensity: tags.intensity || 'moderate',
      difficulty: row.difficulty || 1,
      tier: row.tier,
      foils: tags.foils || [],
      acousticSimilarity: tags.acoustic_similarity || '',
      safetyCritical: tags.safety_critical || false,
      audioUrl: getAudioUrl(row.id, tags.category || 'general'),
    };
  }, [getAudioUrl]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('stimuli_catalog')
        .select('*')
        .eq('type', 'environmental_sound')
        .order('difficulty', { ascending: true });

      if (queryError) throw queryError;

      const transformed = (data || []).map(transformRow);
      setSounds(transformed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch sounds');
    } finally {
      setLoading(false);
    }
  }, [transformRow]);

  const fetchByCategory = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('stimuli_catalog')
        .select('*')
        .eq('type', 'environmental_sound')
        .contains('tags', { category })
        .order('difficulty', { ascending: true });

      if (queryError) throw queryError;

      const transformed = (data || []).map(transformRow);
      setSounds(transformed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch sounds');
    } finally {
      setLoading(false);
    }
  }, [transformRow]);

  const fetchSafetyCritical = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('stimuli_catalog')
        .select('*')
        .eq('type', 'environmental_sound')
        .contains('tags', { safety_critical: true })
        .order('difficulty', { ascending: true });

      if (queryError) throw queryError;

      const transformed = (data || []).map(transformRow);
      setSounds(transformed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch safety sounds');
    } finally {
      setLoading(false);
    }
  }, [transformRow]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('environmental_sound_categories')
        .select('*');

      if (queryError) {
        console.warn('environmental_sound_categories view not available');
        return;
      }

      setCategories(data || []);
    } catch (e) {
      console.warn('Failed to fetch environmental categories:', e);
    }
  }, []);

  const getRandomSound = useCallback((category?: string): EnvironmentalSound | null => {
    let pool = sounds;
    if (category) {
      pool = sounds.filter(s => s.category === category);
    }
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [sounds]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    sounds,
    categories,
    loading,
    error,
    fetchByCategory,
    fetchAll,
    fetchSafetyCritical,
    getRandomSound,
    getAudioUrl,
  };
}
