import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useVoice } from '../store/VoiceContext';
import type { StimulusCatalog, ConversationCategory } from '../types/database.types';

export interface ConversationPair {
  id: string;
  promptText: string;
  responseText: string;
  targetKeyword: string;
  targetPhoneme: string | null;
  category: string;
  difficulty: number;
  tier: string;
  acousticFoil: string;
  semanticFoil: string;
  plausibleFoil: string;
  promptAudioUrl: string | null;
  responseAudioUrl: string | null;
}

interface UseConversationDataReturn {
  conversations: ConversationPair[];
  categories: ConversationCategory[];
  loading: boolean;
  error: string | null;
  fetchByCategory: (category: string) => Promise<void>;
  fetchAll: () => Promise<void>;
  getRandomPair: (category?: string) => ConversationPair | null;
  getAudioUrl: (conversationId: string, type: 'prompt' | 'response') => string;
}

export function useConversationData(): UseConversationDataReturn {
  const { currentVoice } = useVoice();
  const [conversations, setConversations] = useState<ConversationPair[]>([]);
  const [categories, setCategories] = useState<ConversationCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAudioUrl = useCallback((conversationId: string, type: 'prompt' | 'response'): string => {
    const path = `conversations/${currentVoice}/${conversationId}_${type}.mp3`;
    const { data } = supabase.storage.from('audio').getPublicUrl(path);
    return data.publicUrl;
  }, [currentVoice]);

  const transformRow = useCallback((row: StimulusCatalog): ConversationPair => {
    const meta = typeof row.clinical_metadata === 'string'
      ? JSON.parse(row.clinical_metadata)
      : row.clinical_metadata || {};

    return {
      id: row.id,
      promptText: row.prompt_text || row.content_text,
      responseText: row.response_text || '',
      targetKeyword: meta.target_keyword || '',
      targetPhoneme: row.target_phoneme,
      category: meta.category || 'general',
      difficulty: row.difficulty || 2,
      tier: row.tier,
      acousticFoil: meta.acoustic_foil || '',
      semanticFoil: meta.semantic_foil || '',
      plausibleFoil: meta.plausible_foil || '',
      promptAudioUrl: getAudioUrl(row.id, 'prompt'),
      responseAudioUrl: getAudioUrl(row.id, 'response'),
    };
  }, [getAudioUrl]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('stimuli_catalog')
        .select('*')
        .eq('content_type', 'conversation')
        .order('difficulty', { ascending: true });

      if (queryError) throw queryError;

      const transformed = (data || []).map(transformRow);
      setConversations(transformed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch conversations');
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
        .eq('content_type', 'conversation')
        .contains('clinical_metadata', { category })
        .order('difficulty', { ascending: true });

      if (queryError) throw queryError;

      const transformed = (data || []).map(transformRow);
      setConversations(transformed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [transformRow]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error: queryError } = await supabase
        .from('conversation_categories')
        .select('*');

      if (queryError) {
        // View might not exist — fallback to manual aggregation
        console.warn('conversation_categories view not available, using fallback');

        const { data: fallbackData } = await supabase
          .from('stimuli_catalog')
          .select('clinical_metadata, difficulty, target_phoneme')
          .eq('content_type', 'conversation');

        if (fallbackData) {
          const catMap = new Map<string, ConversationCategory>();
          for (const row of fallbackData) {
            const meta = typeof row.clinical_metadata === 'string'
              ? JSON.parse(row.clinical_metadata)
              : row.clinical_metadata || {};
            const cat = meta.category || 'general';

            if (!catMap.has(cat)) {
              catMap.set(cat, {
                category: cat,
                total_pairs: 0,
                min_difficulty: row.difficulty || 1,
                max_difficulty: row.difficulty || 1,
                target_phonemes: null,
              });
            }

            const entry = catMap.get(cat)!;
            entry.total_pairs++;
            entry.min_difficulty = Math.min(entry.min_difficulty, row.difficulty || 1);
            entry.max_difficulty = Math.max(entry.max_difficulty, row.difficulty || 1);
          }

          setCategories(Array.from(catMap.values()));
        }
        return;
      }

      setCategories(data || []);
    } catch (e) {
      console.warn('Failed to fetch conversation categories:', e);
    }
  }, []);

  const getRandomPair = useCallback((category?: string): ConversationPair | null => {
    let pool = conversations;
    if (category) {
      pool = conversations.filter(c => c.category === category);
    }
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [conversations]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    conversations,
    categories,
    loading,
    error,
    fetchByCategory,
    fetchAll,
    getRandomPair,
    getAudioUrl,
  };
}
