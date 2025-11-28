import { useState, useEffect, useRef } from 'react';

interface UseAudioMixerProps {
  voiceSrc: string;
  noiseSrc: string;
  initialSnr?: number; // Signal-to-Noise Ratio in dB (approx)
}

export function useAudioMixer({ voiceSrc, noiseSrc, initialSnr = 0 }: UseAudioMixerProps) {
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const noiseRef = useRef<HTMLAudioElement | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState(0.5); // 0.0 (Noise only) to 1.0 (Voice only)

  useEffect(() => {
    const voice = new Audio(voiceSrc);
    const noise = new Audio(noiseSrc);
    
    voiceRef.current = voice;
    noiseRef.current = noise;
    
    // Noise should loop
    noise.loop = true;

    const handleCanPlay = () => {
      // Wait for both to be ready
      if (voice.readyState >= 3 && noise.readyState >= 3) {
        setIsLoading(false);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      noise.pause(); // Stop noise when voice finishes
      voice.currentTime = 0;
      noise.currentTime = 0;
    };

    voice.addEventListener('canplay', handleCanPlay);
    noise.addEventListener('canplay', handleCanPlay);
    voice.addEventListener('ended', handleEnded);

    // Initial volume set
    updateVolumes(balance);

    return () => {
      voice.pause();
      noise.pause();
      voice.removeEventListener('canplay', handleCanPlay);
      noise.removeEventListener('canplay', handleCanPlay);
      voice.removeEventListener('ended', handleEnded);
      voiceRef.current = null;
      noiseRef.current = null;
    };
  }, [voiceSrc, noiseSrc]);

  const updateVolumes = (bal: number) => {
    if (!voiceRef.current || !noiseRef.current) return;
    
    // Simple linear crossfade for now
    // bal 0.0 -> Voice 0, Noise 1
    // bal 0.5 -> Voice 1, Noise 1 (Max both? Or 0.7?)
    // Let's do: Voice constant (1.0), Noise varies (easier to understand for SNR)
    // "Easier" = Noise volume 0.1
    // "Harder" = Noise volume 1.0
    
    // Actually, a mixer slider usually implies balance.
    // Let's define the slider as "Noise Level".
    // 0% = Silent noise. 100% = Max noise.
    // We will expose `setNoiseLevel` instead of balance for clarity.
  };

  const setNoiseLevel = (level: number) => {
    // level: 0.0 to 1.0
    if (noiseRef.current) {
      noiseRef.current.volume = Math.max(0, Math.min(1, level));
    }
    setBalance(level);
  };

  const togglePlay = () => {
    if (!voiceRef.current || !noiseRef.current) return;

    if (isPlaying) {
      voiceRef.current.pause();
      noiseRef.current.pause();
    } else {
      // Start noise slightly before voice for immersion?
      // For sync, start together.
      noiseRef.current.play();
      voiceRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return {
    isPlaying,
    isLoading,
    noiseLevel: balance,
    setNoiseLevel,
    togglePlay
  };
}