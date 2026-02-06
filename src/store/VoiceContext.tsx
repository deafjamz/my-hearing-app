import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Voice Configuration - Voices with Generated Audio
 *
 * Only includes voices that have audio columns in word_pairs table.
 * See docs/VOICE_LIBRARY.md for full specifications.
 */

type VoiceId = 'sarah' | 'emma' | 'david' | 'marcus';

interface Voice {
  id: VoiceId;
  name: string;
  description: string;
  gender: 'female' | 'male';
}

const VOICES: Voice[] = [
  { id: 'sarah', name: 'Sarah', description: 'Clear & Articulate (Female)', gender: 'female' },
  { id: 'emma', name: 'Emma', description: 'Bright & Energetic (Female)', gender: 'female' },
  { id: 'david', name: 'David', description: 'Clear & Steady (Male)', gender: 'male' },
  { id: 'marcus', name: 'Marcus', description: 'Deep & Natural (Male)', gender: 'male' },
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