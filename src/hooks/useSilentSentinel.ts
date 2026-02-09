import { useRef, useEffect, useCallback } from 'react';

/**
 * useSilentSentinel — Keeps Bluetooth audio route alive AND plays audio
 *
 * Problem: Cochlear Phone Clips, Roger devices, and similar BT relay
 * accessories for CIs/HAs have a 3-4 second audio route delay. When
 * a page plays short isolated clips (Detection, word pairs), the sound
 * gets cut off before it reaches the user through Bluetooth.
 *
 * Additionally, playing audio via plain HTML <audio> / new Audio() creates
 * a separate audio session from the Web Audio API. iOS Safari routes them
 * independently — the sentinel keeps BT alive but words route to speaker.
 *
 * Solution: A persistent near-silent oscillator (~0.0001 gain, -80dB)
 * keeps the Web Audio API output active. The playUrl() method fetches,
 * decodes, and plays audio through the SAME AudioContext/destination,
 * ensuring all audio routes through Bluetooth hearing aids.
 *
 * Usage:
 *   const { ensureResumed, playUrl, stopPlayback } = useSilentSentinel();
 *   // Call ensureResumed() on first user tap (iOS Safari requirement)
 *   // Use playUrl(url) instead of new Audio(url) — routes through BT
 */
export function useSilentSentinel() {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

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
      // Stop any playing audio
      try { sourceRef.current?.stop(); } catch { /* already stopped */ }
      sourceRef.current?.disconnect();
      sourceRef.current = null;

      // Clean up oscillator
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

  /**
   * Play audio through the sentinel's AudioContext.
   * Routes through the same destination as the oscillator so BT hearing
   * aids receive the audio (instead of it going to the phone speaker).
   *
   * Same pattern as useSNRMixer.playTarget():
   * fetch → arrayBuffer → decodeAudioData → BufferSourceNode → destination
   *
   * Returns a promise that resolves when playback finishes.
   */
  const playUrl = useCallback(async (url: string): Promise<void> => {
    const ctx = ctxRef.current;
    if (!ctx) throw new Error('AudioContext not initialized');

    // Resume if needed
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Stop any currently playing audio (handles rapid tapping)
    try { sourceRef.current?.stop(); } catch { /* already stopped */ }
    sourceRef.current?.disconnect();

    // Fetch and decode
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    // Create source and connect to destination
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    sourceRef.current = source;

    // Play and wait for completion
    return new Promise<void>((resolve) => {
      source.onended = () => {
        sourceRef.current = null;
        resolve();
      };
      source.start(0);
    });
  }, []);

  /** Stop any currently playing audio immediately */
  const stopPlayback = useCallback(() => {
    try { sourceRef.current?.stop(); } catch { /* already stopped */ }
    sourceRef.current?.disconnect();
    sourceRef.current = null;
  }, []);

  return {
    audioContext: ctxRef.current,
    ensureResumed,
    playUrl,
    stopPlayback,
  };
}
