import { useState, useCallback, useEffect, useRef } from 'react';

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((path: string) => {
    // Stop any currently playing audio from this hook instance
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const newAudio = new Audio(path);
    audioRef.current = newAudio;

    newAudio.onplay = () => setIsPlaying(true);
    newAudio.onended = () => setIsPlaying(false);
    newAudio.onpause = () => setIsPlaying(false); // Handle pausing as well
    newAudio.onerror = (e) => {
      console.error("Audio Error:", e, path);
      setIsPlaying(false);
    };
    
    newAudio.play().catch(e => {
      // Don't log the common user-interrupt error
      if ((e as DOMException).name !== 'AbortError') {
        console.error("Playback failed:", e);
      }
      setIsPlaying(false);
    });

  }, []);

  // Effect for component unmount cleanup
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause(); // Stop audio when the component unmounts
      }
    };
  }, []);

  return { play, isPlaying };
}
