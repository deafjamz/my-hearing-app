import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '@/store/UserContext';
import {
  applyClinicalMetadataLanguageFilter,
  getAudioVoiceKey,
  normalizeTrainingLanguage,
} from '@/lib/trainingLanguage';
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
  contentLanguage: 'en' | 'es';
  sourceRowId: string;
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
  const { voice, preferredLanguage } = useUser();
  const [conversations, setConversations] = useState<ConversationPair[]>([]);
  const [categories, setCategories] = useState<ConversationCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trainingLanguage = normalizeTrainingLanguage(preferredLanguage);
  const audioVoiceKey = getAudioVoiceKey(voice, trainingLanguage);

  const getAudioUrl = useCallback((conversationId: string, type: 'prompt' | 'response'): string => {
    const path = trainingLanguage === 'es'
      ? `spanish/conversations/${audioVoiceKey}/${conversationId}_${type}.mp3`
      : `conversations/${audioVoiceKey}/${conversationId}_${type}.mp3`;
    const { data } = supabase.storage.from('audio').getPublicUrl(path);
    return data.publicUrl;
  }, [audioVoiceKey, trainingLanguage]);

  const transformRow = useCallback((row: StimulusCatalog): ConversationPair => {
    const meta = typeof row.clinical_metadata === 'string'
      ? JSON.parse(row.clinical_metadata)
      : row.clinical_metadata || {};
    const sourceRowId = String(meta.source_row_id || row.id);

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
      promptAudioUrl: getAudioUrl(sourceRowId, 'prompt'),
      responseAudioUrl: getAudioUrl(sourceRowId, 'response'),
      contentLanguage: trainingLanguage,
      sourceRowId,
    };
  }, [getAudioUrl, trainingLanguage]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await applyClinicalMetadataLanguageFilter(
        supabase
          .from('stimuli_catalog')
          .select('*')
          .eq('content_type', 'conversation'),
        trainingLanguage
      ).order('difficulty', { ascending: true });

      if (queryError) throw queryError;

      const transformed = (data || []).map(transformRow);
      setConversations(transformed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [trainingLanguage, transformRow]);

  const fetchByCategory = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await applyClinicalMetadataLanguageFilter(
        supabase
          .from('stimuli_catalog')
          .select('*')
          .eq('content_type', 'conversation')
          .contains('clinical_metadata', { category }),
        trainingLanguage
      ).order('difficulty', { ascending: true });

      if (queryError) throw queryError;

      const transformed = (data || []).map(transformRow);
      setConversations(transformed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [trainingLanguage, transformRow]);

  const fetchCategories = useCallback(async () => {
    try {
      if (trainingLanguage === 'es') {
        throw new Error('use fallback for localized categories');
      }

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
          // Language segmentation is stored in clinical_metadata for Spanish.

        const localizedData = (fallbackData || []).filter((row) => {
          const meta = typeof row.clinical_metadata === 'string'
            ? JSON.parse(row.clinical_metadata)
            : row.clinical_metadata || {};
          const rowLanguage = meta.content_language || 'en';
          return rowLanguage === trainingLanguage;
        });

        if (localizedData.length > 0) {
          const catMap = new Map<string, ConversationCategory>();
          for (const row of localizedData) {
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
            entry.total_pairs = (entry.total_pairs ?? 0) + 1;
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
  }, [trainingLanguage]);

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
