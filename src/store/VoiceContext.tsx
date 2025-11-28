import React, { createContext, useContext, useState, useEffect } from 'react';

type VoiceId = 'sarah' | 'david' | 'marcus' | 'emma';

interface Voice {
  id: VoiceId;
  name: string;
  description: string;
  gender: 'female' | 'male';
}

const VOICES: Voice[] = [
  { id: 'sarah', name: 'Sarah', description: 'Clear & Articulate', gender: 'female' },
  { id: 'david', name: 'David', description: 'Warm & Friendly', gender: 'male' },
  { id: 'marcus', name: 'Marcus', description: 'Deep & Confident', gender: 'male' },
  { id: 'emma', name: 'Emma', description: 'Bright & Energetic', gender: 'female' },
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