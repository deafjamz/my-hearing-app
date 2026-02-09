import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ActivityData, Scenario, AlignmentData, content_tier } from '@/types/activity';

/**
 * =============================================================================
 * VOICE AUDIO ARCHITECTURE - READ BEFORE MODIFYING
 * =============================================================================
 *
 * Audio URLs are constructed DYNAMICALLY from Supabase Storage paths.
 * We do NOT use database columns for audio paths.
 *
 * Pattern: {SUPABASE_URL}/storage/v1/object/public/audio/words_v2/{voice}/{word}.mp3
 *
 * To add a new voice:
 * 1. Generate audio files to Supabase Storage: audio/words_v2/{voice}/
 * 2. Add voice ID to AVAILABLE_VOICES array below
 * 3. Add voice to VOICES array in src/store/VoiceContext.tsx
 * 4. Update docs/VOICE_LIBRARY.md
 *
 * NO database migrations needed. NO TypeScript types changes needed.
 *
 * See: docs/VOICE_LIBRARY.md for full documentation.
 * =============================================================================
 */

interface StoryDataExtended extends ActivityData {
  alignmentData?: AlignmentData; 
}

// Interface for data fetched from user_clinical_summary view
export interface ClinicalSummaryData {
  practice_date: string; // ISO date string
  total_exercises: number;
  correct_count: number;
  accuracy_percentage: number;
  avg_reaction_time: number;
}

export function useActivityData(id: string | undefined) {
  const [data, setData] = useState<StoryDataExtended | Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // ---------------------------------------------------------
        // 1. Try Fetching as a STORY
        // ---------------------------------------------------------
        let { data: storyData } = await supabase
          .from('stories')
          .select('*')
          .eq('id', id)
          .maybeSingle(); // Use maybeSingle to avoid error if not found

        if (storyData) {
          const mappedStory: StoryDataExtended = {
            id: storyData.id,
            title: storyData.title,
            transcript: storyData.transcript,
            audioSrc: storyData.audio_male_path || '', 
            tier: storyData.tier as content_tier, // Cast to content_tier
            questions: [] 
          };

          // Fetch Alignment Data if available
          if (storyData.alignment_male_path) {
             // Extract relative path logic...
             const urlParts = storyData.alignment_male_path.split('/alignment/');
             if (urlParts.length > 1) {
                const { data: alignmentFile } = await supabase.storage
                  .from('alignment')
                  .download(urlParts[1]);
                
                if (alignmentFile) {
                  try {
                    const text = await alignmentFile.text();
                    mappedStory.alignmentData = JSON.parse(text);
                  } catch (e) { console.error("Alignment parse error", e); }
                }
             }
          }
          
          setData(mappedStory);
          setLoading(false);
          return;
        }

        // ---------------------------------------------------------
        // 2. Try Fetching as a SCENARIO
        // ---------------------------------------------------------
        // Scenarios table uses UUIDs now too.
        let { data: scenarioData } = await supabase
          .from('scenarios')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (scenarioData) {
            // Fetch items for this scenario
            const { data: items } = await supabase
                .from('scenario_items')
                .select('*')
                .eq('scenario_id', scenarioData.id)
                .order('order');

            const mappedScenario: Scenario = {
                id: scenarioData.id,
                title: scenarioData.title,
                description: scenarioData.description,
                difficulty: scenarioData.difficulty,
                tier: scenarioData.tier as content_tier, // Cast to content_tier
                ambience_path: scenarioData.ambience_path,
                items: items?.map(i => ({
                    id: i.id,
                    speaker: i.speaker,
                    text: i.text,
                    difficulty: 'easy', 
                    audio_path: i.audio_path
                })) || []
            };
            
            setData(mappedScenario);
            setLoading(false);
            return;
        }
        
        // 3. Not found in either
        console.warn("Content not found for ID:", id);
        setData(null);

      } catch (err) {
        console.error("Supabase fetch error:", err);
        setError("Failed to load content.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, loading, error };
}

export function useStoriesList() {
  const [stories, setStories] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('title'); 

      if (error) {
        console.error("Error fetching stories list:", error);
      } else if (data) {
        const mappedStories = data.map(s => ({
          id: s.id, 
          title: s.title,
          transcript: s.transcript,
          audioSrc: s.audio_male_path || '', 
          questions: [],
          tier: s.tier as content_tier
        }));
        setStories(mappedStories);
      }
      setLoading(false);
    };

    fetchStories();
  }, []);

  return { stories, loading };
}

export interface WordPair {
  id: string;
  word_1: string;
  word_2: string;
  audio_1: string;
  audio_2: string;
  clinical_category?: string; // Changed from 'category' to 'clinical_category'
  tier: content_tier;
  target_phoneme?: string;
  contrast_phoneme?: string;
  position?: string;
  vowel_context?: string;
}

import { buildWordAudioUrl } from '@/lib/audio';

// Alias for backward compat within this file
const buildAudioUrl = buildWordAudioUrl;

// All 9 voices with generated audio
const AVAILABLE_VOICES = ['sarah', 'emma', 'bill', 'michael', 'alice', 'daniel', 'matilda', 'charlie', 'aravind'];

export function useWordPairs(voice?: string) {
  const [pairs, setPairs] = useState<WordPair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const { data, error } = await supabase
          .from('word_pairs')
          .select('id, word_1, word_2, clinical_category, tier, target_phoneme, contrast_phoneme, position, vowel_context')
          .limit(50);

        if (error) {
          console.error("Error fetching word pairs:", error);
        } else if (data) {
          // Default to 'sarah' if no voice specified or voice not available
          const selectedVoice = voice && AVAILABLE_VOICES.includes(voice) ? voice : 'sarah';

          const mappedPairs = data.map(p => ({
            id: p.id,
            word_1: p.word_1,
            word_2: p.word_2,
            // Build audio URLs dynamically from Supabase storage
            audio_1: buildAudioUrl(selectedVoice, p.word_1),
            audio_2: buildAudioUrl(selectedVoice, p.word_2),
            clinical_category: p.clinical_category || 'General',
            tier: p.tier as content_tier,
            target_phoneme: p.target_phoneme,
            contrast_phoneme: p.contrast_phoneme,
            position: p.position,
            vowel_context: p.vowel_context
          }));
          setPairs(mappedPairs);
        }
      } catch (err) {
        console.error('[useWordPairs] Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPairs();
  }, [voice]);

  return { pairs, loading };
}

// New hook for fetching clinical summary data
export function useClinicalSummary() {
  const [summary, setSummary] = useState<ClinicalSummaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: userSession } = supabase.auth.getUser(); // Get user for RLS
  const userId = userSession?.user?.id;

  useEffect(() => {
    const fetchSummary = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('user_clinical_summary')
        .select('*')
        .eq('user_id', userId) // RLS should handle this, but explicit is safer
        .order('practice_date', { ascending: false });

      if (error) {
        console.error("Error fetching clinical summary:", error);
      } else if (data) {
        setSummary(data as ClinicalSummaryData[]);
      }
      setLoading(false);
    };

    fetchSummary();
  }, [userId]);

  return { summary, loading };
}