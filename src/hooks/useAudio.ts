import { useState, useEffect, useRef } from 'react';

interface UseAudioProps {
  src: string;
  onEnded?: () => void;
}

export function useAudio({ src, onEnded }: UseAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;
    setIsLoading(true);
    setError(null);

    const handleCanPlay = () => {
      setIsLoading(false);
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
      if (onEnded) onEnded();
    };

    const handleError = (e: Event) => {
      setIsLoading(false);
      setIsPlaying(false);
      const target = e.target as HTMLAudioElement;
      setError(`Error loading audio: ${target.error?.message || 'Unknown error'}`);
      console.error("Audio Error:", e);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Attempt to preload metadata
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, [src, onEnded]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error("Playback failed:", err);
          setIsPlaying(false);
          setError("Playback failed. Please check audio settings.");
        });
      }
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (value: number) => {
    if (audioRef.current && duration) {
      const newTime = (value / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(value);
    }
  };

  return {
    isPlaying,
    isLoading,
    error,
    progress,
    duration,
    togglePlay,
    seek
  };
}