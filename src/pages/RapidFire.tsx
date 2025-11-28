import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, XCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WORD_PAIRS } from '@/data/wordPairs';
import { useUser } from '@/store/UserContext';
import { useAudio } from '@/hooks/useAudio';

export function RapidFire() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);

  const { voice } = useUser();
  const { play, isPlaying } = useAudio();

  const currentPair = WORD_PAIRS[currentIndex];
  const hasGuessed = selectedGuess !== null;

  // Refined Auto-Play Logic: Triggers only when the round changes.
  useEffect(() => {
    let timer: NodeJS.Timeout;
    // CRITICAL: Only auto-play if the user hasn't guessed for the current round.
    if (!hasGuessed && currentPair) {
      setIsPreparing(true);
      timer = setTimeout(() => {
        const audioPath = `/hearing-rehab-audio/${voice}_audio/${currentPair.file}.mp3`;
        play(audioPath);
        setIsPreparing(false);
      }, 500);
    }
    
    // Cleanup function to prevent ghost sounds on navigation or fast guessing.
    return () => {
      clearTimeout(timer);
      if (isPreparing) setIsPreparing(false);
    };
  }, [currentIndex]); // Dependency is ONLY currentIndex to trigger on a new round.

  const handleManualPlay = () => {
    if (currentPair) {
      const audioPath = `/hearing-rehab-audio/${voice}_audio/${currentPair.file}.mp3`;
      play(audioPath);
    }
  };
  
  const handleGuess = (guess: string) => {
    if (hasGuessed) return;
    setSelectedGuess(guess);
  };

  // Fixed Game Loop Logic
  const nextRound = () => {
    // 1. Reset state for the current round completely.
    setSelectedGuess(null);
    // 2. Then, advance to the next round.
    setCurrentIndex((prev) => (prev + 1) % WORD_PAIRS.length);
  };

  // Guard Clause for data loading
  if (!currentPair) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500">Loading Game Data...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 dark:bg-slate-950 z-50">
      
      {/* 1. Header (Fixed) */}
      <div className="flex-none p-4 flex items-center justify-between z-10">
        <Link to="/practice" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="text-slate-900 dark:text-white font-black text-lg">Rapid Fire</div>
        <div className="w-8 h-8" />
      </div>

      {/* 2. Scrollable Content Area */}
      {/* Padding bottom prevents content from being hidden by the absolute footer */}
      <div className="flex-1 overflow-y-auto px-4 pb-40">
        <div className="max-w-md mx-auto space-y-6 pt-4">
          
          <div className="flex justify-center py-8">
            <button 
              onClick={handleManualPlay}
              className={cn(
                "w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-purple-600 shadow-xl shadow-purple-500/30 flex items-center justify-center text-white transition-all duration-300",
                "hover:scale-105 active:scale-95",
                (isPreparing || isPlaying) && "scale-110 ring-4 ring-purple-500/30"
              )}
            >
              <Play size={40} fill="currentColor" className="ml-1" />
            </button>
          </div>

          <h2 className="text-center text-slate-900 dark:text-white font-bold text-xl mb-4">
            Which word did you hear?
          </h2>

          <div className="space-y-3">
            {currentPair.options.map((option) => (
              <button
                key={option}
                onClick={() => handleGuess(option)}
                disabled={hasGuessed}
                className={cn(
                  'w-full p-5 text-left font-bold text-lg rounded-2xl border-2 transition-all shadow-sm disabled:cursor-not-allowed',
                  hasGuessed && option === currentPair.correct 
                    ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-600 dark:text-green-300'
                    : hasGuessed && option === selectedGuess && option !== currentPair.correct
                    ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-600 dark:text-red-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-purple-300 dark:hover:border-purple-600'
                )}
              >
                <div className="flex justify-between items-center">
                  <span>{option}</span>
                  {hasGuessed && option === currentPair.correct && (<CheckCircle size={20} className="text-green-500" />)}
                  {hasGuessed && option === selectedGuess && option !== currentPair.correct && (<XCircle size={20} className="text-red-500" />)}
                </div>
              </button>
            ))}
          </div>

          {hasGuessed && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-5 rounded-2xl">
              <h3 className="text-blue-700 dark:text-blue-300 font-bold mb-1">Did you know?</h3>
              <p className="text-blue-600 dark:text-blue-200 text-sm leading-relaxed">
                The difference is in the Voicing. "{currentPair.correct}" uses your vocal cords!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Fixed Footer with Visual Glitch Fix */}
      {/* `absolute bottom-0` ensures it's at the very bottom. `pb-8` adds safe area padding for devices with a home bar. */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md z-20">
        <div className="max-w-md mx-auto">
          <button 
            onClick={nextRound}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-slate-900/10"
          >
            {hasGuessed ? 'Next Round' : 'Skip'}
          </button>
        </div>
      </div>

    </div>
  );
}
