import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Voice Configuration - 9-Voice Roster
 *
 * All voices have generated audio in Supabase storage.
 * Audio path: audio/words_v2/{voice}/{word}.mp3
 * See docs/VOICE_LIBRARY.md for full specifications.
 */

type VoiceId = 'sarah' | 'emma' | 'bill' | 'michael' | 'alice' | 'daniel' | 'matilda' | 'charlie' | 'aravind';

interface Voice {
  id: VoiceId;
  name: string;
  description: string;
  gender: 'female' | 'male';
  region: 'US' | 'UK' | 'AU' | 'IN';
}

const VOICES: Voice[] = [
  // US Voices
  { id: 'sarah', name: 'Sarah', description: 'Clear & Articulate', gender: 'female', region: 'US' },
  { id: 'emma', name: 'Emma', description: 'Bright & Energetic', gender: 'female', region: 'US' },
  { id: 'bill', name: 'Bill', description: 'Steady & Natural', gender: 'male', region: 'US' },
  { id: 'michael', name: 'Michael', description: 'Deep & Clear', gender: 'male', region: 'US' },
  // UK Voices
  { id: 'alice', name: 'Alice', description: 'British RP', gender: 'female', region: 'UK' },
  { id: 'daniel', name: 'Daniel', description: 'News Anchor Clarity', gender: 'male', region: 'UK' },
  // AU Voices
  { id: 'matilda', name: 'Matilda', description: 'Bright Australian', gender: 'female', region: 'AU' },
  { id: 'charlie', name: 'Charlie', description: 'Clear Australian', gender: 'male', region: 'AU' },
  // IN Voice
  { id: 'aravind', name: 'Aravind', description: 'Global English', gender: 'male', region: 'IN' },
];

interface VoiceContextType {
  currentVoice: VoiceId;
  setVoice: (id: VoiceId) => void;
  getVoiceDetails: (id: VoiceId) => Voice | undefined;
  availableVoices: Voice[];
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const [currentVoice, setCurrentVoice] = useState<VoiceId>('sarah');

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('preferredVoice') as VoiceId;
    if (saved && VOICES.some(v => v.id === saved)) {
      setCurrentVoice(saved);
    }
  }, []);

  const setVoice = (id: VoiceId) => {
    setCurrentVoice(id);
    localStorage.setItem('preferredVoice', id);
  };

  const getVoiceDetails = (id: VoiceId) => VOICES.find(v => v.id === id);

  return (
    <VoiceContext.Provider value={{ currentVoice, setVoice, getVoiceDetails, availableVoices: VOICES }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}