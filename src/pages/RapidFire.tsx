import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, XCircle, CheckCircle, Flame } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import { useUser } from '../store/UserContext';
import { WORD_PAIRS } from '../data/wordPairs';
import { cn } from '@/lib/utils';

export function RapidFire() {
  const { voice, currentStreak, incrementStreak, resetStreak } = useUser();
  const { play, isPlaying } = useAudio();
  
  // Game State
  const [shuffledPairs, setShuffledPairs] = useState<typeof WORD_PAIRS>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);

  // Shuffle on Mount
  useEffect(() => {
    setShuffledPairs([...WORD_PAIRS].sort(() => Math.random() - 0.5));
  }, []);

  if (!shuffledPairs || shuffledPairs.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500">Loading Game...</div>
      </div>
    );
  }

  const currentPair = shuffledPairs[currentIndex];
  const hasGuessed = selectedGuess !== null;

  const playAudio = () => {
    if (!currentPair) return;
    const path = `/hearing-rehab-audio/${voice}_audio/${currentPair.file}.mp3`;
    play(path);
  };

  const handleGuess = (guess: string) => {
    if (hasGuessed) return;
    setSelectedGuess(guess);
    
    if (guess === currentPair.correct) {
      incrementStreak();
    } else {
      resetStreak();
    }
  };

  const handleNext = () => {
    setSelectedGuess(null);
    setCurrentIndex((prev) => (prev + 1) % shuffledPairs.length);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 dark:bg-slate-950 z-50">
      
      {/* 1. Header */}
      <div className="flex-none p-4 px-6 flex items-center justify-between z-10 border-b border-slate-100 dark:border-slate-800">
        <Link to="/practice" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          <ArrowLeft size={24} />
        </Link>
        <div className="text-slate-900 dark:text-white font-black text-lg">Word Pairs</div>
        <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
          <Flame className="text-orange-500 fill-orange-500" size={16} />
          <span className="text-orange-700 dark:text-orange-300 font-bold text-sm tabular-nums">{currentStreak}</span>
        </div>
      </div>

      {/* 2. Game Content (Centered Vertically) */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full space-y-8" key={currentIndex}>
          
          <div className="flex justify-center">
            <button 
              onClick={playAudio}
              className={cn(
                "w-28 h-28 rounded-full bg-gradient-to-tr from-purple-500 to-purple-600 shadow-xl shadow-purple-500/30 flex items-center justify-center text-white transition-all",
                isPlaying ? 'scale-110' : 'hover:scale-105 active:scale-95'
              )}
            >
              <Play size={48} fill="currentColor" className="ml-2" />
            </button>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-slate-900 dark:text-white font-black text-2xl tracking-tight">Which word?</h2>
          </div>

          <div className="space-y-3">
            {currentPair.options.map((option) => {
              const isSelected = selectedGuess === option;
              const isTheCorrectAnswer = option === currentPair.correct;
              
              let cardStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-purple-300 dark:hover:border-purple-700";
              if (hasGuessed) {
                if (isTheCorrectAnswer) cardStyle = "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700 text-green-700 dark:text-green-300 ring-1 ring-green-500/50";
                else if (isSelected) cardStyle = "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-700 text-red-700 dark:text-red-400 ring-1 ring-red-500/50";
                else cardStyle = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-60 grayscale";
              }

              return (
                <button
                  key={option}
                  onClick={() => handleGuess(option)}
                  disabled={hasGuessed}
                  className={`w-full p-6 text-left font-bold text-xl rounded-2xl border-2 transition-all shadow-sm flex justify-between items-center ${cardStyle}`}
                >
                  <span>{option}</span>
                  {hasGuessed && isTheCorrectAnswer && <CheckCircle size={24} className="text-green-600" />}
                  {hasGuessed && isSelected && !isTheCorrectAnswer && <XCircle size={24} className="text-red-500" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Footer (Always Visible) */}
      <div className="absolute bottom-0 left-0 right-0 w-full p-4 pb-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.2)] z-50">
        <button 
          onClick={handleNext}
          disabled={!hasGuessed}
          className={cn(
            "w-full max-w-md mx-auto py-4 rounded-2xl font-bold text-lg transition-all shadow-lg",
            hasGuessed 
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] active:scale-[0.98]' 
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
          )}
        >
          {hasGuessed ? 'Next Round' : 'Select an Answer'}
        </button>
      </div>
    </div>
  );
}
