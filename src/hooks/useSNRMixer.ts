import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Web Audio API-based SNR (Signal-to-Noise Ratio) Mixer
 *
 * CONTINUOUS MODE (Clinically Valid):
 * - Noise plays continuously throughout the session
 * - Target words play on top of the noise bed
 * - Simulates real-world listening environments (restaurant, classroom)
 *
 * SNR Control:
 * - Positive SNR (e.g., +10 dB): Speech is louder than noise (easier)
 * - Zero SNR (0 dB): Speech and noise are equal volume (moderate)
 * - Negative SNR (e.g., -5 dB): Noise is louder than speech (harder)
 *
 * Clinical Context:
 * CI users typically need +5 to +15 dB SNR for 80% comprehension in noise.
 * Adaptive training gradually reduces SNR as performance improves.
 */

interface UseSNRMixerProps {
  noiseUrl?: string;
  initialSNR?: number; // Initial SNR in dB (default: +10)
  noiseEnabled?: boolean; // User-controlled noise toggle (default: false per 00_MASTER_RULES.md Section 6)
}

export function useSNRMixer(props?: UseSNRMixerProps) {
  const [isNoiseRunning, setIsNoiseRunning] = useState(false);
  const [isTargetPlaying, setIsTargetPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snr, setSNRState] = useState(props?.initialSNR ?? 10); // Default +10 dB
  const [audioContextState, setAudioContextState] = useState<AudioContextState>('suspended');
  const [noiseEnabled, setNoiseEnabledState] = useState(props?.noiseEnabled ?? false); // Default OFF (Silent Sentinel)

  // Web Audio API references
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const targetSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const targetGainRef = useRef<GainNode | null>(null);

  // Audio buffers
  const noiseBufferRef = useRef<AudioBuffer | null>(null);

  /**
   * Convert dB to linear gain
   * Formula: gain = 10^(dB/20)
   */
  const dbToGain = (db: number): number => {
    return Math.pow(10, db / 20);
  };

  /**
   * Update gain nodes based on SNR and noiseEnabled state
   *
   * Strategy (Silent Sentinel per 00_MASTER_RULES.md Section 6):
   * - Target speech: Always at fixed gain (0 dB = 1.0)
   * - Noise: Conditional on noiseEnabled
   *   - If noiseEnabled = false: Silent Sentinel (0.0001 gain = -90dB, inaudible but keeps stream alive)
   *   - If noiseEnabled = true: Calculated gain based on SNR
   *
   * Why 0.0001 and not 0.0:
   * - Pure zero triggers iOS/Android battery savers to kill Bluetooth stream
   * - Microscopic signal keeps MFi/ASHA connection open without audible noise
   */
  const updateGains = useCallback((snrValue: number, enabled: boolean) => {
    if (!targetGainRef.current || !noiseGainRef.current) return;

    const targetGain = 1.0; // 0 dB (reference level)

    // Silent Sentinel (0.0001) vs Audible Noise (calculated)
    const noiseGain = enabled ? dbToGain(-snrValue) : 0.0001;

    targetGainRef.current.gain.value = targetGain;
    noiseGainRef.current.gain.value = noiseGain;

    console.log(`[useSNRMixer] Gains updated: target=${targetGain.toFixed(2)}, noise=${noiseGain.toFixed(4)} (${enabled ? 'AUDIBLE' : 'SILENT SENTINEL'})`);
  }, []);

  /**
   * Initialize Web Audio API context and nodes
   */
  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Track AudioContext state changes (for mobile debugging)
        setAudioContextState(audioContextRef.current.state);
        console.log('[useSNRMixer] AudioContext initialized. State:', audioContextRef.current.state);

        // Listen for state changes
        audioContextRef.current.addEventListener('statechange', () => {
          if (audioContextRef.current) {
            setAudioContextState(audioContextRef.current.state);
            console.log('[useSNRMixer] AudioContext state changed:', audioContextRef.current.state);
          }
        });

        // Create gain nodes
        targetGainRef.current = audioContextRef.current.createGain();
        noiseGainRef.current = audioContextRef.current.createGain();

        // Connect to destination
        targetGainRef.current.connect(audioContextRef.current.destination);
        noiseGainRef.current.connect(audioContextRef.current.destination);

        // Set initial gains (Silent Sentinel mode by default)
        updateGains(snr, noiseEnabled);
      }
    };

    initAudioContext();

    return () => {
      // Cleanup
      if (audioContextRef.current?.state !== 'closed') {
        noiseSourceRef.current?.stop();
        targetSourceRef.current?.stop();
        noiseSourceRef.current?.disconnect();
        targetSourceRef.current?.disconnect();
      }
    };
  }, []);

  /**
   * Load audio buffer from URL
   */
  const loadAudioBuffer = async (url: string): Promise<AudioBuffer> => {
    if (!audioContextRef.current) {
      throw new Error('AudioContext not initialized');
    }

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContextRef.current.decodeAudioData(arrayBuffer);
  };

  /**
   * Preload noise buffer
   */
  useEffect(() => {
    const preloadNoise = async () => {
      if (!props?.noiseUrl) return;

      setIsLoading(true);
      setError(null);

      try {
        noiseBufferRef.current = await loadAudioBuffer(props.noiseUrl);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load noise:', err);
        setError('Failed to load background noise');
        setIsLoading(false);
      }
    };

    preloadNoise();
  }, [props?.noiseUrl]);

  /**
   * Start continuous noise bed (Silent Sentinel Pattern)
   *
   * Per 00_MASTER_RULES.md Section 6:
   * - ALWAYS starts playback to keep Bluetooth stream alive
   * - Initial gain set to Silent Sentinel (0.0001) or audible based on noiseEnabled
   * - No fade in/out (instant response to user toggle)
   * - Prevents MFi/ASHA connection beeps
   */
  const startNoise = useCallback(async () => {
    if (!audioContextRef.current || !noiseGainRef.current) {
      setError('Audio system not initialized');
      return;
    }

    if (isNoiseRunning) {
      console.warn('[useSNRMixer] Noise already running');
      return;
    }

    try {
      if (!noiseBufferRef.current) {
        console.warn('[useSNRMixer] No noise buffer loaded - Silent Sentinel disabled');
        return;
      }

      // Resume AudioContext if suspended (iOS requirement)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Stop any existing noise
      noiseSourceRef.current?.stop();
      noiseSourceRef.current?.disconnect();

      // Create new noise source
      noiseSourceRef.current = audioContextRef.current.createBufferSource();
      noiseSourceRef.current.buffer = noiseBufferRef.current;
      noiseSourceRef.current.loop = true; // Continuous loop (never stops)
      noiseSourceRef.current.connect(noiseGainRef.current);

      // Set initial gain: Silent Sentinel (0.0001) or Audible (calculated)
      // NO fade in - instant response to toggle
      const initialGain = noiseEnabled ? dbToGain(-snr) : 0.0001;
      noiseGainRef.current.gain.value = initialGain;

      // Start playback (Silent Sentinel keeps Bluetooth alive)
      noiseSourceRef.current.start(0);
      setIsNoiseRunning(true);

      console.log(`[useSNRMixer] ✅ Noise started in ${noiseEnabled ? 'AUDIBLE' : 'SILENT SENTINEL'} mode`);
    } catch (err) {
      console.error('[useSNRMixer] Failed to start noise:', err);
      setError('Failed to start background noise');
    }
  }, [isNoiseRunning, snr, noiseEnabled]);

  /**
   * Stop continuous noise bed
   * Fades out over 0.5 seconds
   */
  const stopNoise = useCallback(() => {
    if (!audioContextRef.current || !noiseGainRef.current || !noiseSourceRef.current) {
      return;
    }

    try {
      // Fade out
      const now = audioContextRef.current.currentTime;
      noiseGainRef.current.gain.setValueAtTime(noiseGainRef.current.gain.value, now);
      noiseGainRef.current.gain.linearRampToValueAtTime(0, now + 0.5);

      // Stop after fade out
      setTimeout(() => {
        noiseSourceRef.current?.stop();
        noiseSourceRef.current?.disconnect();
        setIsNoiseRunning(false);
      }, 500);
    } catch (err) {
      console.error('Failed to stop noise:', err);
    }
  }, []);

  /**
   * Play target audio on top of continuous noise
   *
   * @param targetUrl - URL of the target speech file
   */
  const playTarget = useCallback(async (targetUrl: string) => {
    if (!audioContextRef.current || !targetGainRef.current) {
      setError('Audio system not initialized');
      return;
    }

    try {
      setError(null);

      // Load target buffer
      const targetBuffer = await loadAudioBuffer(targetUrl);

      // Resume AudioContext if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Stop any existing target
      targetSourceRef.current?.stop();
      targetSourceRef.current?.disconnect();

      // Create new target source
      targetSourceRef.current = audioContextRef.current.createBufferSource();
      targetSourceRef.current.buffer = targetBuffer;
      targetSourceRef.current.loop = false;
      targetSourceRef.current.connect(targetGainRef.current);

      // Set up ended callback
      targetSourceRef.current.onended = () => {
        setIsTargetPlaying(false);
      };

      // Start playback
      targetSourceRef.current.start(0);
      setIsTargetPlaying(true);
    } catch (err) {
      console.error('Failed to play target:', err);
      setError('Failed to play audio');
      setIsTargetPlaying(false);
    }
  }, []);

  /**
   * Set SNR dynamically during session
   *
   * @param snrDB - Signal-to-Noise Ratio in decibels
   *                Positive = speech louder (easier)
   *                Negative = noise louder (harder)
   */
  const setSNR = useCallback((snrDB: number) => {
    setSNRState(snrDB);
    updateGains(snrDB, noiseEnabled);
  }, [updateGains, noiseEnabled]);

  /**
   * Toggle noise on/off (Silent Sentinel vs Audible)
   *
   * Per 00_MASTER_RULES.md Section 6:
   * - Does NOT stop/start playback (prevents Bluetooth disconnect)
   * - Only adjusts gain between 0.0001 (silent) and calculated (audible)
   * - Instant response (no fade)
   *
   * @param enabled - true = audible noise, false = silent sentinel
   */
  const setNoiseEnabled = useCallback((enabled: boolean) => {
    setNoiseEnabledState(enabled);
    updateGains(snr, enabled);
    console.log(`[useSNRMixer] Noise ${enabled ? 'ENABLED' : 'DISABLED'} (Silent Sentinel: ${!enabled})`);
  }, [snr, updateGains]);

  /**
   * Resume AudioContext - Critical for Mobile
   *
   * Mobile browsers (iOS, Android) suspend AudioContext until user interaction.
   * Call this on first user touch (e.g., "Start Session" button).
   *
   * @returns Promise<boolean> - true if resumed, false if failed
   */
  const resumeAudio = useCallback(async (): Promise<boolean> => {
    if (!audioContextRef.current) {
      console.warn('[useSNRMixer] Cannot resume: AudioContext not initialized');
      return false;
    }

    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        console.log('[useSNRMixer] ✅ AudioContext resumed. State:', audioContextRef.current.state);
        return true;
      } catch (err) {
        console.error('[useSNRMixer] ❌ Failed to resume AudioContext:', err);
        setError('Failed to unlock audio. Please try tapping the screen.');
        return false;
      }
    } else {
      console.log('[useSNRMixer] AudioContext already running. State:', audioContextRef.current.state);
      return true;
    }
  }, []);

  /**
   * Update gains when SNR or noiseEnabled changes
   */
  useEffect(() => {
    updateGains(snr, noiseEnabled);
  }, [snr, noiseEnabled, updateGains]);

  return {
    isNoiseRunning,
    isTargetPlaying,
    isPlaying: isTargetPlaying, // Backward compatibility
    isLoading,
    error,
    snr,
    noiseEnabled, // Expose current state
    audioContextState, // Expose state for debugging
    startNoise,
    stopNoise,
    playTarget,
    setSNR,
    setNoiseEnabled, // User toggle for noise
    resumeAudio, // Mobile audio unlock
    stop: stopNoise, // Backward compatibility
  };
}
