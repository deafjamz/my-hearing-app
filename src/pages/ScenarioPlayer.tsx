import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Pause, FastForward, Rewind, Volume2, VolumeX, Music } from 'lucide-react';
import { useActivityData } from '@/hooks/useActivityData';
import { ActivityHeader } from '@/components/ui/ActivityHeader';
import { cn } from '@/lib/utils';
import { Scenario, ScenarioItem } from '@/types/activity';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface ScenarioItemDisplay extends ScenarioItem {
  isPlaying: boolean;
}

export function ScenarioPlayer() {
  const { id } = useParams<{ id: string }>();
  const { data: scenario, loading, error } = useActivityData(id);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ambienceVolume, setAmbienceVolume] = useState(0.5);
  const [isAmbiencePlaying, setIsAmbiencePlaying] = useState(false); // Track separately for debug

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const ambiencePlayerRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio Players
  useEffect(() => {
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
      audioPlayerRef.current.onended = () => {
        // Advance logic
        if (scenario && 'items' in scenario && currentLineIndex < (scenario as Scenario).items.length - 1) {
          setCurrentLineIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
          setCurrentLineIndex(0);
        }
      };
      audioPlayerRef.current.onplay = () => setIsPlaying(true);
      audioPlayerRef.current.onpause = () => setIsPlaying(false);
    }

    if (!ambiencePlayerRef.current) {
      ambiencePlayerRef.current = new Audio();
      ambiencePlayerRef.current.loop = true;
      ambiencePlayerRef.current.volume = ambienceVolume;
      ambiencePlayerRef.current.onplay = () => setIsAmbiencePlaying(true);
      ambiencePlayerRef.current.onpause = () => setIsAmbiencePlaying(false);
      ambiencePlayerRef.current.onerror = (e) => console.error("Ambience Error:", e);
    }

    return () => {
      audioPlayerRef.current?.pause();
      ambiencePlayerRef.current?.pause();
    };
  }, [scenario]); // Only re-run if scenario object reference changes (should be stable after load)

  // Update Ambience Volume
  useEffect(() => {
    if (ambiencePlayerRef.current) {
      ambiencePlayerRef.current.volume = ambienceVolume;
    }
  }, [ambienceVolume]);

  // Load Audio Sources
  useEffect(() => {
    if (!scenario) return;

    // Load Ambience
    if (scenario.ambience_path && ambiencePlayerRef.current && ambiencePlayerRef.current.src !== scenario.ambience_path) {
      if (import.meta.env.DEV) console.log("Loading Ambience:", scenario.ambience_path);
      ambiencePlayerRef.current.src = scenario.ambience_path;
      ambiencePlayerRef.current.load();
    }

    // Load Dialogue Line
    const items = (scenario as Scenario).items as ScenarioItemDisplay[];
    if (items && items[currentLineIndex]) {
      const line = items[currentLineIndex];
      if (audioPlayerRef.current && line.audio_path && audioPlayerRef.current.src !== line.audio_path) {
         audioPlayerRef.current.src = line.audio_path;
         if (isPlaying) {
             audioPlayerRef.current.play().catch(e => console.error("Auto-advance play failed:", e));
         }
      }
    }
  }, [scenario, currentLineIndex, isPlaying]);


  const togglePlayback = useCallback(async () => {
    if (!audioPlayerRef.current || !ambiencePlayerRef.current) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      ambiencePlayerRef.current.pause();
    } else {
      // Start Both
      try {
        await audioPlayerRef.current.play();
        // Try to play ambience only if it exists
        if (ambiencePlayerRef.current.src) {
             ambiencePlayerRef.current.play().catch(e => console.error("Ambience play failed:", e));
        }
      } catch (e) {
        console.error("Playback failed:", e);
      }
    }
  }, [isPlaying]);

  // Debug: Toggle Ambience Only
  const toggleAmbienceOnly = () => {
      if (!ambiencePlayerRef.current) return;
      if (isAmbiencePlaying) {
          ambiencePlayerRef.current.pause();
      } else {
          ambiencePlayerRef.current.play().catch(e => console.error("Manual Ambience Play Failed:", e));
      }
  };

  if (loading) return <LoadingSpinner message="Loading scenario..." />;
  if (error || !scenario) return <div className="p-8 text-center text-red-500">Error loading scenario.</div>;

  const dialogueItems = (scenario as Scenario).items as ScenarioItemDisplay[];
  const currentLine = dialogueItems[currentLineIndex];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
        <ActivityHeader title={scenario.title} backPath="/practice" />
      </header>

      <main className="max-w-lg mx-auto w-full px-6 py-8 flex-1 flex flex-col items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 text-center space-y-4 w-full">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{currentLine?.speaker}</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white min-h-[4rem] flex items-center justify-center">
             {currentLine?.text}
          </h1>

          <div className="flex items-center justify-center gap-4 pt-4">
            <button onClick={() => setCurrentLineIndex(prev => Math.max(0, prev - 1))} 
                    disabled={currentLineIndex === 0} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200">
              <Rewind size={24} />
            </button>
            
            <button onClick={togglePlayback} className="w-20 h-20 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all">
              {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
            </button>
            
            <button onClick={() => setCurrentLineIndex(prev => Math.min(dialogueItems.length - 1, prev + 1))} 
                    disabled={currentLineIndex === dialogueItems.length - 1} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200">
              <FastForward size={24} />
            </button>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Background Ambience</span>
                {/* Debug Button */}
                <button onClick={toggleAmbienceOnly} className="text-xs text-purple-500 hover:underline flex items-center gap-1">
                    {isAmbiencePlaying ? <Pause size={12} /> : <Play size={12} />} Test Only Ambience
                </button>
            </div>
            
            <div className="flex items-center gap-3 text-slate-500">
                <VolumeX size={18} />
                <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambienceVolume}
                onChange={(e) => setAmbienceVolume(parseFloat(e.target.value))}
                className="flex-1 accent-purple-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                disabled={!scenario.ambience_path}
                />
                <Volume2 size={18} />
            </div>
             {!scenario.ambience_path && <p className="text-xs text-red-400 mt-1">No ambience file linked.</p>}
          </div>

        </div>
      </main>
    </div>
  );
}