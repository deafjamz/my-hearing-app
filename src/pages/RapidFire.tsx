import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, XCircle, CheckCircle } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import { useUser } from '../store/UserContext';
import { WORD_PAIRS } from '../data/wordPairs';
import { cn } from '@/lib/utils';

export function RapidFire() {
  const { voice } = useUser();
  const { play, isPlaying } = useAudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);
  
  // Safety Check
  if (!WORD_PAIRS || WORD_PAIRS.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500">Loading Game...</div>
      </div>
    );
  }
  
  const currentPair = WORD_PAIRS[currentIndex];
  const hasGuessed = selectedGuess !== null;

  const handleGuess = (guess: string) => {
    if (hasGuessed) return;
    setSelectedGuess(guess);
  };

  const nextRound = () => {
    setSelectedGuess(null);
    setCurrentIndex((prev) => (prev + 1) % WORD_PAIRS.length);
  };

  // MANUAL PLAY ONLY
  const playAudio = () => {
    const path = `/hearing-rehab-audio/${voice}_audio/${currentPair.file}.mp3`;
    play(path);
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 dark:bg-slate-950 z-50">
      {/* Header - Updated Title */}
      <div className="flex-none p-4 flex items-center justify-between z-10">
        <Link to="/practice" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="text-slate-900 dark:text-white font-black text-lg">Word Pairs</div>
        <div className="w-8 h-8" />
      </div>

      {/* Game Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-40">
        <div className="max-w-md mx-auto space-y-6 pt-4">
          <div className="flex justify-center py-8">
            <button 
              onClick={playAudio}
              className={cn(
                "w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-purple-600 shadow-xl shadow-purple-500/30 flex items-center justify-center text-white transition-all",
                isPlaying ? "scale-110" : "hover:scale-105 active:scale-95"
              )}
            >
              <Play size={40} fill="currentColor" className="ml-1" />
            </button>
          </div>
          <h2 className="text-center text-slate-900 dark:text-white font-bold text-xl mb-4">Which word did you hear?</h2>
          
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
        </div>
      </div>

      {/* Footer - White Line Fix */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-20 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.2)]">
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
