import { useState, useCallback, useEffect, useRef } from 'react';

const LOAD_TIMEOUT_MS = 10_000;

interface UseAudioProps {
  src?: string;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

/** Map HTMLMediaElement error codes to user-friendly messages */
function describeMediaError(audio: HTMLAudioElement): string {
  const err = audio.error;
  if (!err) return 'Playback failed';

  switch (err.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'Playback was interrupted';
    case MediaError.MEDIA_ERR_NETWORK:
      return 'Network error — check your connection';
    case MediaError.MEDIA_ERR_DECODE:
      return 'Audio could not be decoded';
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return 'Audio format not supported';
    default:
      return 'Playback failed';
  }
}

export function useAudio(props?: UseAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const srcRef = useRef<string | undefined>(props?.src);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Clear any pending load timeout */
  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  /** Start a load timeout — if audio doesn't become playable in time, show error */
  const startLoadTimeout = useCallback(() => {
    clearLoadTimeout();
    loadTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError('Audio is taking too long — tap to retry');
      }
    }, LOAD_TIMEOUT_MS);
  }, [clearLoadTimeout, isLoading]);

  // Initialize audio instance
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setError(null);
      clearLoadTimeout();
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

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      clearLoadTimeout();
      const message = describeMediaError(audio);
      console.error('Audio Error:', audio.error);
      setError(message);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      clearLoadTimeout();
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
      clearLoadTimeout();
    };
  }, []); // Run once on mount

  // Handle Source Changes
  useEffect(() => {
    if (props?.src && props.src !== srcRef.current) {
      srcRef.current = props.src;
      if (audioRef.current) {
        setIsPlaying(false);
        setError(null);
        setIsLoading(true);
        startLoadTimeout();

        audioRef.current.src = props.src;
        audioRef.current.load();
      }
    }
  }, [props?.src, startLoadTimeout]);

  const play = useCallback((path?: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (path) {
      audio.src = path;
      srcRef.current = path;
    }

    if (!audio.src) {
        setError('No audio source provided.');
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
          console.warn('Play interrupted:', e);
          setIsPlaying(false);
          setIsLoading(false);
          if (e.name === 'AbortError') return;
          if (e.name === 'NotAllowedError') {
            setError('Tap to enable audio playback');
          } else {
            setError("Couldn't play audio — tap to retry");
          }
        });
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const retry = useCallback(() => {
    setError(null);
    if (srcRef.current) {
      play(srcRef.current);
    }
  }, [play]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      try {
        if (props?.src && (!audioRef.current?.src || audioRef.current.src !== new URL(props.src, window.location.href).href)) {
          play(props.src);
        } else {
          play();
        }
      } catch {
        // new URL() can throw on malformed src — fall through to play()
        play(props?.src);
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
    retry,
    currentTime: audioRef.current?.currentTime || 0,
  };
}
