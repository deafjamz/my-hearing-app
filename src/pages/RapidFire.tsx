import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, XCircle, CheckCircle, Flame, ArrowRight } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import { useUser } from '../store/UserContext';
import { WORD_PAIRS } from '../data/wordPairs';
import { cn } from '@/lib/utils';

export function RapidFire() {
  const { voice, currentStreak, incrementStreak, resetStreak } = useUser();
  const { play, isPlaying } = useAudio();
  
  const [shuffledPairs, setShuffledPairs] = useState<typeof WORD_PAIRS>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);

  // Shuffle on Mount for replayability
  useEffect(() => {
    setShuffledPairs([...WORD_PAIRS].sort(() => Math.random() - 0.5));
  }, []);

  // Guard Clause for initial data load
  if (!shuffledPairs || shuffledPairs.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500">Loading Game...</div>
      </div>
    );
  }

  const currentPair = shuffledPairs[currentIndex];
  const hasGuessed = selectedGuess !== null;
  const isCorrect = hasGuessed && selectedGuess === currentPair.correct;

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <Link to="/practice" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-slate-900 dark:text-white font-black text-lg">Word Pairs</h1>
        <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
          <Flame className="text-orange-500 fill-orange-500" size={16} />
          <span className="text-orange-700 dark:text-orange-300 font-bold text-sm tabular-nums">{currentStreak}</span>
        </div>
      </header>

      {/* Main Game Content (Scrollable) */}
      <main className="max-w-lg mx-auto w-full px-6 py-8 pb-20 flex-1" key={currentIndex}>
        
        {/* State 1: Play Button (Only shows before guessing) */}
        {!hasGuessed && (
          <div className="flex justify-center mb-8 animate-in fade-in zoom-in-95 duration-300">
            <button 
              onClick={playAudio} 
              className={cn(
                "w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-purple-600 shadow-xl shadow-purple-500/30 flex items-center justify-center text-white transition-all",
                isPlaying ? 'scale-110' : 'hover:scale-105 active:scale-95'
              )}
            >
              <Play size={40} fill="currentColor" className="ml-1 text-white" />
            </button>
          </div>
        )}

        <h2 className="text-center text-slate-900 dark:text-white font-bold text-xl mb-6">
          {hasGuessed 
            ? (isCorrect ? "Correct!" : "Nice Try!")
            : "Which word did you hear?"}
        </h2>

        <div className="space-y-3 mb-8">
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

        {/* State 2: Next Button (Only shows after guessing) */}
        {hasGuessed && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={handleNext}
              className={cn(
                "w-full py-4 text-white rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-colors",
                isCorrect 
                  ? "bg-green-500 hover:bg-green-600" 
                  : "bg-slate-700 hover:bg-slate-800"
              )}
            >
              <span>Next Word</span>
              <ArrowRight size={24} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
