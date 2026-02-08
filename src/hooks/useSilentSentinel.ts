import { useRef, useEffect, useCallback } from 'react';

/**
 * useSilentSentinel — Keeps Bluetooth audio route alive
 *
 * Problem: Cochlear Phone Clips, Roger devices, and similar BT relay
 * accessories for CIs/HAs have a 3-4 second audio route delay. When
 * a page plays short isolated clips (Detection, word pairs), the sound
 * gets cut off before it reaches the user through Bluetooth.
 *
 * Solution: A persistent near-silent oscillator (~0.0001 gain, -80dB)
 * keeps the Web Audio API output active. The Bluetooth relay stays
 * connected, so when a real word plays, it transmits instantly.
 *
 * Usage:
 *   const { audioContext, ensureResumed } = useSilentSentinel();
 *   // Call ensureResumed() on first user tap (iOS Safari requirement)
 *   // Then play audio normally — BT route is already warm
 */
export function useSilentSentinel() {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);

  // Initialize AudioContext and silent oscillator
  useEffect(() => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // Oscillator → GainNode(0.0001) → Destination
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = 440; // Frequency doesn't matter at this gain
    gain.gain.value = 0.0001;  // -80dB — inaudible but keeps BT alive

    osc.connect(gain);
    gain.connect(ctx.destination);

    oscRef.current = osc;
    gainRef.current = gain;

    return () => {
      // Clean up on unmount
      try {
        osc.stop();
      } catch {
        // Already stopped
      }
      osc.disconnect();
      gain.disconnect();
      ctx.close();
      ctxRef.current = null;
      oscRef.current = null;
      gainRef.current = null;
      startedRef.current = false;
    };
  }, []);

  // Resume context and start oscillator (must be called from user gesture)
  const ensureResumed = useCallback(async () => {
    const ctx = ctxRef.current;
    const osc = oscRef.current;
    if (!ctx || !osc) return;

    // Resume suspended AudioContext (required by iOS Safari)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Start oscillator (can only be called once)
    if (!startedRef.current) {
      osc.start();
      startedRef.current = true;
    }
  }, []);

  return {
    audioContext: ctxRef.current,
    ensureResumed,
  };
}
