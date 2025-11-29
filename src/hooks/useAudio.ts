import { useState, useCallback, useEffect, useRef } from 'react';

interface UseAudioProps {
  src?: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void; // New prop
}

export function useAudio(props?: UseAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLInputElement | null>(null);
  const srcRef = useRef<string | undefined>(props?.src);

  // Initialize audio instance
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError(null); // Clear error on play attempt
    };
    
    const handlePause = () => setIsPlaying(false);
    
    const handleEnded = () => {
      setIsPlaying(false);
      if (props?.onEnded) props.onEnded();
    };

    const handleTimeUpdate = () => {
      if (props?.onTimeUpdate && audioRef.current) {
        props.onTimeUpdate(audioRef.current.currentTime);
      }
    };

    const handleError = (e: Event | string) => {
      setIsLoading(false);
      setIsPlaying(false);
      const errorMessage = typeof e === 'string' ? e : "Playback failed";
      console.error("Audio Error:", e);
      setError("Failed to load audio");
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate); // Add timeupdate listener
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate); // Clean up
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
    };
  }, []); // Run once on mount

  // Handle Source Changes
  useEffect(() => {
    if (props?.src && props.src !== srcRef.current) {
      srcRef.current = props.src;
      if (audioRef.current) {
        // Reset state
        setIsPlaying(false);
        setError(null);
        setIsLoading(true);
        
        audioRef.current.src = props.src;
        audioRef.current.load();
      }
    }
  }, [props?.src]);

  const play = useCallback((path?: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (path) {
      audio.src = path;
      srcRef.current = path;
    }

    if (!audio.src) {
        setError("No audio source provided.");
        return;
    }

    setIsLoading(true);
    setError(null);
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsLoading(false);
        })
        .catch((e) => {
          console.warn("Play interrupted:", e);
          setIsPlaying(false);
          setIsLoading(false);
          if (e.name !== 'AbortError') {
             setError("Couldn't play audio");
          }
        });
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      if (props?.src && (!audioRef.current?.src || audioRef.current.src !== new URL(props.src, window.location.href).href)) {
          play(props.src);
      } else {
          play();
      }
    }
  }, [isPlaying, pause, play, props?.src]);

  return { 
    isPlaying, 
    isLoading, 
    error, 
    play, 
    pause, 
    togglePlay,
    currentTime: audioRef.current?.currentTime || 0 // Expose current time
  };
}
