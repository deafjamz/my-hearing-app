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
  const { selectedVoice } = useVoice();
  const [conversations, setConversations] = useState<ConversationPair[]>([]);
  const [categories, setCategories] = useState<ConversationCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAudioUrl = useCallback((conversationId: string, type: 'prompt' | 'response'): string => {
    const voiceName = selectedVoice?.name || 'sarah';
    const path = `conversations/${voiceName}/${conversationId}_${type}.mp3`;
    const { data } = supabase.storage.from('audio').getPublicUrl(path);
    return data.publicUrl;
  }, [selectedVoice]);

  const transformRow = useCallback((row: StimulusCatalog): ConversationPair => {
    const tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags || {};

    return {
      id: row.id,
      promptText: row.prompt_text || row.text,
      responseText: row.response_text || '',
      targetKeyword: tags.target_keyword || '',
      targetPhoneme: row.target_phoneme,
      category: tags.category || 'general',
      difficulty: row.difficulty || 2,
      tier: row.tier,
      acousticFoil: tags.acoustic_foil || '',
      semanticFoil: tags.semantic_foil || '',
      plausibleFoil: tags.plausible_foil || '',
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
        .eq('type', 'conversation')
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
        .eq('type', 'conversation')
        .contains('tags', { category })
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
        // View might not exist yet, fallback to manual aggregation
        console.warn('conversation_categories view not available');
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
