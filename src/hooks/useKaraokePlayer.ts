import { useState, useEffect, useRef, useCallback } from 'react';

// Alignment data format from ElevenLabs
interface AlignmentData {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface KaraokePlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  words: string[];
  activeWordIndex: number;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
}

/**
 * Process raw character-level alignment data into word boundaries.
 */
const processAlignmentData = (data: AlignmentData): { words: string[]; boundaries: { start: number; end: number }[] } => {
  if (!data || !data.characters || data.characters.length === 0) {
    return { words: [], boundaries: [] };
  }

  const words: string[] = [];
  const boundaries: { start: number; end: number }[] = [];
  let currentWord = '';
  let wordStartTime = 0;

  data.characters.forEach((char, index) => {
    if (currentWord === '' && char !== ' ') {
      wordStartTime = data.character_start_times_seconds[index];
    }

    currentWord += char;

    if (char === ' ') {
      if (currentWord.trim() !== '') {
        words.push(currentWord.trim());
        const wordEndTime = data.character_end_times_seconds[index - 1];
        boundaries.push({ start: wordStartTime, end: wordEndTime });
      }
      currentWord = '';
    }
  });

  // Add the last word if transcript doesn't end with a space
  if (currentWord.trim() !== '') {
    words.push(currentWord.trim());
    const lastCharIndex = data.characters.length - 1;
    const wordEndTime = data.character_end_times_seconds[lastCharIndex];
    boundaries.push({ start: wordStartTime, end: wordEndTime });
  }

  return { words, boundaries };
};

/**
 * useKaraokePlayer — Karaoke-style audio player with word highlighting.
 *
 * Uses Web Audio API (fetch → decodeAudioData → BufferSourceNode) instead of
 * HTML Audio elements to ensure audio routes through Bluetooth hearing aids.
 * Includes a built-in silent sentinel oscillator to keep BT route alive.
 *
 * See: useSilentSentinel.ts for the BT routing pattern explanation.
 */
export const useKaraokePlayer = (
  audioSrc?: string,
  alignmentSrc?: string,
  { onEnded }: { onEnded?: () => void } = {}
): KaraokePlayerState => {
  const [words, setWords] = useState<string[]>([]);
  const [wordBoundaries, setWordBoundaries] = useState<{ start: number; end: number }[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loading tracked per resource
  const [alignmentLoaded, setAlignmentLoaded] = useState(!alignmentSrc);
  const [audioLoaded, setAudioLoaded] = useState(!audioSrc);
  const [ctxReady, setCtxReady] = useState(false);

  // Web Audio API refs
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const sentinelStartedRef = useRef(false);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playStartCtxTimeRef = useRef(0);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const isPlayingRef = useRef(false);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const isLoading = !alignmentLoaded || !audioLoaded;

  // 1. Create AudioContext with silent sentinel for BT hearing aids
  useEffect(() => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 440;
    gain.gain.value = 0.0001; // -80dB — inaudible but keeps BT route alive
    osc.connect(gain);
    gain.connect(ctx.destination);
    oscRef.current = osc;

    setCtxReady(true);

    return () => {
      cancelAnimationFrame(rafRef.current);
      try { sourceRef.current?.stop(); } catch { /* already stopped */ }
      sourceRef.current?.disconnect();
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
      gain.disconnect();
      ctx.close();
      ctxRef.current = null;
      oscRef.current = null;
    };
  }, []);

  // 2. Fetch and parse alignment data
  useEffect(() => {
    if (!alignmentSrc) {
      setAlignmentLoaded(true);
      return;
    }

    let cancelled = false;
    setAlignmentLoaded(false);
    setError(null);

    fetch(alignmentSrc)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch alignment data');
        return res.json();
      })
      .then((data: AlignmentData) => {
        if (cancelled) return;
        const { words: processedWords, boundaries } = processAlignmentData(data);
        setWords(processedWords);
        setWordBoundaries(boundaries);
      })
      .catch(err => {
        if (cancelled) return;
        if (import.meta.env.DEV) console.error('Alignment Error:', err);
        setError('Could not load story alignment.');
      })
      .finally(() => { if (!cancelled) setAlignmentLoaded(true); });

    return () => { cancelled = true; };
  }, [alignmentSrc]);

  // 3. Fetch and decode audio into AudioBuffer (waits for AudioContext)
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!audioSrc || !ctxReady || !ctx) {
      if (!audioSrc) setAudioLoaded(true);
      return;
    }

    let cancelled = false;
    setAudioLoaded(false);

    fetch(audioSrc)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch audio');
        return res.arrayBuffer();
      })
      .then(buf => ctx.decodeAudioData(buf))
      .then(decoded => {
        if (!cancelled) audioBufferRef.current = decoded;
      })
      .catch(err => {
        if (!cancelled) {
          if (import.meta.env.DEV) console.error('Audio load error:', err);
          setError('Could not load story audio.');
        }
      })
      .finally(() => { if (!cancelled) setAudioLoaded(true); });

    return () => { cancelled = true; };
  }, [audioSrc, ctxReady]);

  // 4. rAF loop for karaoke word highlighting
  const tick = useCallback(() => {
    const ctx = ctxRef.current;
    if (!isPlayingRef.current || !ctx) return;

    const elapsed = ctx.currentTime - playStartCtxTimeRef.current;
    const playbackTime = offsetRef.current + elapsed;

    const idx = wordBoundaries.findIndex(
      b => playbackTime >= b.start && playbackTime < b.end
    );
    setActiveWordIndex(idx);

    rafRef.current = requestAnimationFrame(tick);
  }, [wordBoundaries]);

  // 5. Playback controls
  const play = useCallback(async () => {
    const ctx = ctxRef.current;
    const buffer = audioBufferRef.current;
    const osc = oscRef.current;
    if (!ctx || !buffer) return;

    // Resume AudioContext (iOS Safari requires user gesture)
    if (ctx.state === 'suspended') await ctx.resume();

    // Start sentinel oscillator (once)
    if (osc && !sentinelStartedRef.current) {
      osc.start();
      sentinelStartedRef.current = true;
    }

    // Stop any existing source
    try { sourceRef.current?.stop(); } catch { /* already stopped */ }
    sourceRef.current?.disconnect();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    sourceRef.current = source;

    source.onended = () => {
      if (isPlayingRef.current) {
        isPlayingRef.current = false;
        setIsPlaying(false);
        setActiveWordIndex(-1);
        offsetRef.current = 0;
        cancelAnimationFrame(rafRef.current);
        onEndedRef.current?.();
      }
    };

    playStartCtxTimeRef.current = ctx.currentTime;
    source.start(0, offsetRef.current);

    isPlayingRef.current = true;
    setIsPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !isPlayingRef.current) return;

    // Record how far into the audio we are
    const elapsed = ctx.currentTime - playStartCtxTimeRef.current;
    offsetRef.current += elapsed;

    // Stop source (BufferSourceNodes can't be paused — stop and recreate)
    try { sourceRef.current?.stop(); } catch { /* already stopped */ }
    sourceRef.current?.disconnect();
    sourceRef.current = null;

    isPlayingRef.current = false;
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  return {
    isPlaying,
    isLoading,
    error,
    words,
    activeWordIndex,
    play,
    pause,
    togglePlay,
  };
};
