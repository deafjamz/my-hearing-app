import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ActivityData, Scenario, AlignmentData } from '@/types/activity';

interface StoryDataExtended extends ActivityData {
  alignmentData?: AlignmentData; // Optional alignment data for karaoke
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
        // 1. Try to fetch from Stories
        let { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select('*')
          .eq('id', id)
          .single();

        if (storyData) {
          const mappedStory: StoryDataExtended = {
            id: storyData.id,
            title: storyData.title,
            transcript: storyData.transcript,
            audioSrc: storyData.audio_male_path || '', 
            tier: storyData.tier,
            questions: [] 
          };

          // Fetch Alignment Data if available
          if (storyData.alignment_male_path) {
            const urlParts = storyData.alignment_male_path.split('/alignment/');
            if (urlParts.length > 1) {
                const relativePath = urlParts[1];
                const { data: alignmentFile, error: alignmentError } = await supabase.storage
                  .from('alignment')
                  .download(relativePath);
                
                if (alignmentError) {
                  console.error("Error downloading alignment file:", alignmentError);
                } else if (alignmentFile) {
                  const text = await alignmentFile.text(); // Use .text() for Blob
                  try {
                    mappedStory.alignmentData = JSON.parse(text);
                  } catch (parseError) {
                    console.error("Error parsing alignment JSON:", parseError);
                  }
                }
            }
          }
          
          setData(mappedStory);
          setLoading(false);
          return;
        }
        
        if (storyError) {
           console.error("Error fetching story:", storyError);
        }
        
        setData(null); // Not found
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
          tier: s.tier
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
  category: string;
  tier: string;
}

export function useWordPairs() {
  const [pairs, setPairs] = useState<WordPair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPairs = async () => {
      const { data, error } = await supabase
        .from('word_pairs')
        .select('*');

      if (error) {
        console.error("Error fetching word pairs:", error);
      } else if (data) {
        // Map DB structure to simpler frontend structure
        // Note: We need logic to choose which audio path (1 vs 2) matches the correct answer later
        // But the game logic handles swapping.
        const mappedPairs = data.map(p => ({
          id: p.id,
          word_1: p.word_1,
          word_2: p.word_2,
          audio_1: p.audio_1_path || '', // Supabase URL
          audio_2: p.audio_2_path || '', // Supabase URL
          category: p.clinical_category || 'General',
          tier: p.tier
        }));
        setPairs(mappedPairs);
      }
      setLoading(false);
    };

    fetchPairs();
  }, []);

  return { pairs, loading };
}
