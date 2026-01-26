import { useState, useEffect, useCallback } from 'react';
import { FileSystemService } from '@/lib/audio/FileSystemService';
import { useSNRMixer } from '@/lib/audio/SNRMixer';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Enhanced Audio Player Hook with Capacitor Integration
 *
 * Replaces the old useAudio hook with:
 * - Offline caching via FileSystemService
 * - SNR mixing support
 * - Haptic feedback
 * - Smart preloading
 */

interface UseAudioPlayerOptions {
  audioUrl: string | null;
  noiseUrl?: string | null;
  targetSNR?: number;
  enableHaptics?: boolean;
  autoPreload?: boolean;
}

export function useAudioPlayer({
  audioUrl,
  noiseUrl = null,
  targetSNR = 10,
  enableHaptics = true,
  autoPreload = true,
}: UseAudioPlayerOptions) {
  const [cachedAudioUrl, setCachedAudioUrl] = useState<string | null>(null);
  const [cachedNoiseUrl, setCachedNoiseUrl] = useState<string | null>(null);
  const [caching, setCaching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use SNR mixer if noise is provided
  const {
    play: playMixed,
    stop: stopMixed,
    isLoading: mixerLoading,
    isPlaying: mixerPlaying,
    error: mixerError,
  } = useSNRMixer(cachedAudioUrl, cachedNoiseUrl, targetSNR);

  // Simple audio element for non-mixed playback
  const [simpleAudio, setSimpleAudio] = useState<HTMLAudioElement | null>(null);
  const [simpleAudioPlaying, setSimpleAudioPlaying] = useState(false);

  /**
   * Cache audio files using FileSystemService
   */
  useEffect(() => {
    if (!audioUrl) return;

    const cacheAudio = async () => {
      setCaching(true);
      setError(null);

      try {
        // Cache main audio
        const cachedUrl = await FileSystemService.getAudioUri(audioUrl);
        setCachedAudioUrl(cachedUrl);

        // Cache noise if provided
        if (noiseUrl) {
          const cachedNoise = await FileSystemService.getAudioUri(noiseUrl);
          setCachedNoiseUrl(cachedNoise);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cache audio');
      } finally {
        setCaching(false);
      }
    };

    if (autoPreload) {
      cacheAudio();
    }
  }, [audioUrl, noiseUrl, autoPreload]);

  /**
   * Initialize simple audio element for non-mixed playback
   */
  useEffect(() => {
    if (!cachedAudioUrl || noiseUrl) return; // Don't use simple audio if mixing

    const audio = new Audio(cachedAudioUrl);

    audio.addEventListener('ended', () => {
      setSimpleAudioPlaying(false);
    });

    audio.addEventListener('error', (e) => {
      setError('Audio playback failed');
      setSimpleAudioPlaying(false);
    });

    setSimpleAudio(audio);

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [cachedAudioUrl, noiseUrl]);

  /**
   * Trigger haptic feedback
   */
  const triggerHaptic = useCallback(async (style: ImpactStyle) => {
    if (!enableHaptics || !Capacitor.isNativePlatform()) return;

    try {
      await Haptics.impact({ style });
    } catch (err) {
      console.warn('Haptics not available:', err);
    }
  }, [enableHaptics]);

  /**
   * Play audio (mixed or simple)
   */
  const play = useCallback(async () => {
    if (noiseUrl && cachedNoiseUrl) {
      // Use SNR mixer for noise mixing
      playMixed();
      await triggerHaptic(ImpactStyle.Light);
    } else if (simpleAudio) {
      // Simple playback
      try {
        await simpleAudio.play();
        setSimpleAudioPlaying(true);
        await triggerHaptic(ImpactStyle.Light);
      } catch (err) {
        setError('Failed to play audio');
      }
    }
  }, [noiseUrl, cachedNoiseUrl, simpleAudio, playMixed, triggerHaptic]);

  /**
   * Stop audio
   */
  const stop = useCallback(async () => {
    if (noiseUrl && cachedNoiseUrl) {
      stopMixed();
    } else if (simpleAudio) {
      simpleAudio.pause();
      simpleAudio.currentTime = 0;
      setSimpleAudioPlaying(false);
    }
    await triggerHaptic(ImpactStyle.Medium);
  }, [noiseUrl, cachedNoiseUrl, simpleAudio, stopMixed, triggerHaptic]);

  /**
   * Trigger success haptic
   */
  const hapticSuccess = useCallback(async () => {
    await triggerHaptic(ImpactStyle.Light);
    // Double tap pattern
    setTimeout(() => triggerHaptic(ImpactStyle.Light), 100);
  }, [triggerHaptic]);

  /**
   * Trigger error haptic
   */
  const hapticError = useCallback(async () => {
    await triggerHaptic(ImpactStyle.Heavy);
  }, [triggerHaptic]);

  const isLoading = caching || mixerLoading;
  const isPlaying = noiseUrl ? mixerPlaying : simpleAudioPlaying;
  const finalError = error || mixerError;

  return {
    play,
    stop,
    isLoading,
    isPlaying,
    error: finalError,
    hapticSuccess,
    hapticError,
    isCached: !!cachedAudioUrl,
  };
}

/**
 * Hook to preload multiple audio files
 */
export function useAudioPreloader(urls: string[]) {
  const [preloading, setPreloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cachedCount, setCachedCount] = useState(0);

  const preload = useCallback(async () => {
    if (urls.length === 0) return;

    setPreloading(true);
    setProgress(0);
    setCachedCount(0);

    const total = urls.length;
    let cached = 0;

    for (const url of urls) {
      try {
        await FileSystemService.getAudioUri(url);
        cached++;
        setCachedCount(cached);
        setProgress((cached / total) * 100);
      } catch (err) {
        console.error(`Failed to preload ${url}:`, err);
      }
    }

    setPreloading(false);
  }, [urls]);

  useEffect(() => {
    preload();
  }, [preload]);

  return {
    preloading,
    progress,
    cachedCount,
    totalCount: urls.length,
  };
}

/**
 * Hook to manage audio cache
 */
export function useAudioCache() {
  const [cacheSize, setCacheSize] = useState(0);
  const [clearing, setClearing] = useState(false);

  const getCacheSize = useCallback(async () => {
    const size = await FileSystemService.getCacheSize();
    setCacheSize(size);
    return size;
  }, []);

  const clearCache = useCallback(async () => {
    setClearing(true);
    try {
      await FileSystemService.clearCache();
      setCacheSize(0);
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setClearing(false);
    }
  }, []);

  useEffect(() => {
    getCacheSize();
  }, [getCacheSize]);

  return {
    cacheSize,
    cacheSizeMB: (cacheSize / (1024 * 1024)).toFixed(2),
    clearCache,
    clearing,
    refresh: getCacheSize,
  };
}
