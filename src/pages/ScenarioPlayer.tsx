import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, FastForward, Rewind, Volume2, VolumeX } from 'lucide-react';
import { useActivityData } from '@/hooks/useActivityData';
import { useProgress } from '@/hooks/useProgress';
import { useUser } from '@/store/UserContext';
import { getVoiceGender } from '@/lib/voiceGender';
import { ActivityHeader } from '@/components/ui/ActivityHeader';
import { Scenario } from '@/types/activity';
import { LoadingSpinner } from '@/components/LoadingSpinner';

/**
 * ScenarioPlayer — Multi-speaker dialogue player with background ambience.
 *
 * Uses Web Audio API for all audio to ensure Bluetooth hearing aid routing.
 * Two concurrent streams: dialogue (sequential lines) + ambience (looping).
 * Both route through the same AudioContext with a silent sentinel oscillator.
 */
export function ScenarioPlayer() {
  const { id } = useParams<{ id: string }>();
  const { data: scenario, loading, error } = useActivityData(id);
  const { logProgress } = useProgress();
  const { voice } = useUser();
  const selectedVoice = voice || 'sarah';
  const sessionStartRef = useRef<number>(Date.now());
  const hasLoggedCompletionRef = useRef(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ambienceVolume, setAmbienceVolume] = useState(0.5);
  const [isAmbiencePlaying, setIsAmbiencePlaying] = useState(false);

  // Refs for stable callback access (avoids stale closures)
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;
  const currentLineIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  // Web Audio API refs
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const sentinelStartedRef = useRef(false);
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());

  // Dialogue refs
  const dialogueSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isDialoguePlayingRef = useRef(false);

  // Ambience refs
  const ambienceSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ambienceGainRef = useRef<GainNode | null>(null);
  const ambienceBufferRef = useRef<AudioBuffer | null>(null);

  // 1. Create AudioContext with silent sentinel for BT hearing aids
  useEffect(() => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 440;
    gain.gain.value = 0.0001; // -80dB — keeps BT route alive
    osc.connect(gain);
    gain.connect(ctx.destination);
    oscRef.current = osc;

    return () => {
      try { dialogueSourceRef.current?.stop(); } catch { /* already stopped */ }
      try { ambienceSourceRef.current?.stop(); } catch { /* already stopped */ }
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
      gain.disconnect();
      ctx.close();
      ctxRef.current = null;
    };
  }, []);

  // Resume AudioContext (iOS Safari requires user gesture)
  const ensureResumed = useCallback(async () => {
    const ctx = ctxRef.current;
    const osc = oscRef.current;
    if (!ctx || !osc) return;
    if (ctx.state === 'suspended') await ctx.resume();
    if (!sentinelStartedRef.current) {
      osc.start();
      sentinelStartedRef.current = true;
    }
  }, []);

  // Fetch + decode audio with cache
  const getBuffer = useCallback(async (url: string): Promise<AudioBuffer | null> => {
    const ctx = ctxRef.current;
    if (!ctx || !url) return null;
    const cached = bufferCacheRef.current.get(url);
    if (cached) return cached;
    try {
      const res = await fetch(url);
      const buf = await ctx.decodeAudioData(await res.arrayBuffer());
      bufferCacheRef.current.set(url, buf);
      return buf;
    } catch {
      return null;
    }
  }, []);

  // 2. Pre-fetch ambience audio on scenario load
  useEffect(() => {
    if (!scenario?.ambience_path) return;
    getBuffer(scenario.ambience_path).then(buf => {
      if (buf) ambienceBufferRef.current = buf;
    });
  }, [scenario?.ambience_path, getBuffer]);

  // 3. Ambience controls
  const stopAmbience = useCallback(() => {
    try { ambienceSourceRef.current?.stop(); } catch { /* already stopped */ }
    ambienceSourceRef.current?.disconnect();
    ambienceGainRef.current?.disconnect();
    ambienceSourceRef.current = null;
    ambienceGainRef.current = null;
    setIsAmbiencePlaying(false);
  }, []);

  const startAmbience = useCallback(() => {
    const ctx = ctxRef.current;
    const buf = ambienceBufferRef.current;
    if (!ctx || !buf) return;

    stopAmbience();

    const source = ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = ambienceVolume;
    source.connect(gain);
    gain.connect(ctx.destination);

    ambienceSourceRef.current = source;
    ambienceGainRef.current = gain;
    source.start();
    setIsAmbiencePlaying(true);
  }, [ambienceVolume, stopAmbience]);

  // Update ambience volume on GainNode directly
  useEffect(() => {
    if (ambienceGainRef.current) {
      ambienceGainRef.current.gain.value = ambienceVolume;
    }
  }, [ambienceVolume]);

  // 4. Dialogue playback — plays a line and auto-advances on ended
  const playLine = useCallback(async (lineIndex: number) => {
    const ctx = ctxRef.current;
    const scn = scenarioRef.current;
    if (!ctx || !scn) return;

    const items = (scn as Scenario).items;
    const line = items[lineIndex];
    if (!line?.audio_path) return;

    await ensureResumed();

    // Stop existing dialogue
    isDialoguePlayingRef.current = false;
    try { dialogueSourceRef.current?.stop(); } catch { /* already stopped */ }
    dialogueSourceRef.current?.disconnect();

    const buffer = await getBuffer(line.audio_path);
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    dialogueSourceRef.current = source;
    isDialoguePlayingRef.current = true;

    source.onended = () => {
      if (!isDialoguePlayingRef.current) return; // Manually stopped
      dialogueSourceRef.current = null;
      isDialoguePlayingRef.current = false;

      // Auto-advance to next line
      const items = (scenarioRef.current as Scenario)?.items;
      if (!items) return;

      const idx = currentLineIndexRef.current;
      if (idx < items.length - 1) {
        const nextIdx = idx + 1;
        currentLineIndexRef.current = nextIdx;
        setCurrentLineIndex(nextIdx);
        playLine(nextIdx);
      } else {
        // End of scenario — log completion
        isPlayingRef.current = false;
        setIsPlaying(false);
        currentLineIndexRef.current = 0;
        setCurrentLineIndex(0);
        stopAmbience();

        if (!hasLoggedCompletionRef.current) {
          hasLoggedCompletionRef.current = true;
          const scn = scenarioRef.current as Scenario | null;
          logProgress({
            contentType: 'scenario',
            contentId: scn?.id || id || 'unknown',
            result: 'correct',
            metadata: {
              activityType: 'scenario',
              voiceId: selectedVoice,
              voiceGender: getVoiceGender(selectedVoice),
              totalLines: items.length,
              listeningDurationMs: Date.now() - sessionStartRef.current,
            },
          });
        }
      }
    };

    source.start(0);
  }, [ensureResumed, getBuffer, stopAmbience]);

  // 5. Play/Pause toggle
  const togglePlayback = useCallback(async () => {
    if (isPlayingRef.current) {
      // Pause
      isDialoguePlayingRef.current = false;
      try { dialogueSourceRef.current?.stop(); } catch { /* already stopped */ }
      dialogueSourceRef.current?.disconnect();
      dialogueSourceRef.current = null;
      stopAmbience();
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      // Play
      await ensureResumed();
      isPlayingRef.current = true;
      setIsPlaying(true);
      startAmbience();
      playLine(currentLineIndexRef.current);
    }
  }, [ensureResumed, startAmbience, stopAmbience, playLine]);

  // Skip forward/backward
  const skipTo = useCallback((newIndex: number) => {
    isDialoguePlayingRef.current = false;
    try { dialogueSourceRef.current?.stop(); } catch { /* already stopped */ }
    dialogueSourceRef.current?.disconnect();
    dialogueSourceRef.current = null;

    currentLineIndexRef.current = newIndex;
    setCurrentLineIndex(newIndex);

    if (isPlayingRef.current) {
      playLine(newIndex);
    }
  }, [playLine]);

  // Toggle ambience only (debug/test)
  const toggleAmbienceOnly = useCallback(async () => {
    if (isAmbiencePlaying) {
      stopAmbience();
    } else {
      await ensureResumed();
      startAmbience();
    }
  }, [isAmbiencePlaying, ensureResumed, startAmbience, stopAmbience]);

  if (loading) return <LoadingSpinner message="Loading scenario..." />;
  if (error || !scenario) return <div className="p-8 text-center text-red-500">Error loading scenario.</div>;

  const dialogueItems = (scenario as Scenario).items;
  const currentLine = dialogueItems[currentLineIndex];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
        <ActivityHeader title={scenario.title} backPath="/practice/scenarios" />
      </header>

      <main className="max-w-lg mx-auto w-full px-6 py-4 flex-1 flex flex-col items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 text-center space-y-4 w-full">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{currentLine?.speaker}</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white min-h-[4rem] flex items-center justify-center">
             {currentLine?.text}
          </h1>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => skipTo(Math.max(0, currentLineIndex - 1))}
              disabled={currentLineIndex === 0}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <Rewind size={24} className="text-slate-600 dark:text-slate-300" />
            </button>

            <button
              onClick={togglePlayback}
              className="w-20 h-20 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
            </button>

            <button
              onClick={() => skipTo(Math.min(dialogueItems.length - 1, currentLineIndex + 1))}
              disabled={currentLineIndex === dialogueItems.length - 1}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              <FastForward size={24} className="text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Progress */}
          <div className="text-xs text-slate-400 dark:text-slate-500">
            Line {currentLineIndex + 1} of {dialogueItems.length}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Background Ambience</span>
                <button onClick={toggleAmbienceOnly} className="text-xs text-teal-500 hover:underline flex items-center gap-1">
                    {isAmbiencePlaying ? <Pause size={12} /> : <Play size={12} />} Test
                </button>
            </div>

            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <VolumeX size={18} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambienceVolume}
                  onChange={(e) => setAmbienceVolume(parseFloat(e.target.value))}
                  className="flex-1 accent-teal-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  disabled={!scenario.ambience_path}
                />
                <Volume2 size={18} />
            </div>
             {!scenario.ambience_path && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No ambience file linked.</p>}
          </div>

        </div>
      </main>
    </div>
  );
}
