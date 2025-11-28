import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, XCircle, CheckCircle, Flame, ArrowRight } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import { useUser } from '../store/UserContext';
import { WORD_PAIRS } from '../data/wordPairs';
import { cn } from '@/lib/utils';

export function RapidFire() {
  const { voice, currentStreak, incrementStreak, resetStreak } = useUser();
  const { play, isPlaying } = useAudio();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);

  // Guard Clause
  if (!WORD_PAIRS || WORD_PAIRS.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-500">Loading Game...</div>
      </div>
    );
  }

  const currentPair = WORD_PAIRS[currentIndex];
  const hasGuessed = selectedGuess !== null;
  const isCorrect = hasGuessed && selectedGuess === currentPair.correct;

  const playAudio = () => {
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

  const nextRound = () => {
    // Strict Reset Order
    setSelectedGuess(null);
    setCurrentIndex((prev) => (prev + 1) % WORD_PAIRS.length);
  };

  const handleActionClick = () => {
    if (hasGuessed) {
      nextRound();
    } else {
      playAudio();
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      {/* Header (flex-none) */}
      <header className="flex-none p-4 px-6 flex items-center justify-between z-10 border-b border-slate-100 dark:border-slate-800">
        <Link to="/practice" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-slate-900 dark:text-white font-black text-lg">Word Pairs</h1>
        <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 px-3 py-1.5 rounded-full">
          <Flame className="text-orange-500 fill-orange-500" size={16} />
          <span className="text-orange-700 dark:text-orange-300 font-bold text-sm tabular-nums">{currentStreak}</span>
        </div>
      </header>

      {/* Main Game Area (Vertically Centered) */}
      <main className="flex-1 overflow-y-auto" key={currentIndex}>
        <div className="max-w-md mx-auto w-full flex flex-col justify-center min-h-full p-6 space-y-8">
          
          {/* Unified Action Button */}
          <div className="flex justify-center">
            <button 
              onClick={handleActionClick}
              className={cn(
                "w-28 h-28 rounded-full bg-gradient-to-tr shadow-xl flex items-center justify-center text-white transition-all duration-300",
                "hover:scale-105 active:scale-95",
                isPlaying && 'scale-110',
                !hasGuessed && "from-purple-500 to-purple-600 shadow-purple-500/30",
                isCorrect && "from-green-500 to-green-600 shadow-green-500/30",
                hasGuessed && !isCorrect && "from-red-500 to-red-600 shadow-red-500/30"
              )}
            >
              {hasGuessed 
                ? <ArrowRight size={48} /> 
                : <Play size={48} fill="currentColor" className="ml-2" />
              }
            </button>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-slate-900 dark:text-white font-black text-2xl tracking-tight">Which word did you hear?</h2>
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
                  className={`w-full p-5 text-left font-bold text-lg rounded-2xl border-2 transition-all shadow-sm flex justify-between items-center ${cardStyle}`}
                >
                  <span>{option}</span>
                  {hasGuessed && isTheCorrectAnswer && <CheckCircle size={20} className="text-green-600" />}
                  {hasGuessed && isSelected && !isTheCorrectAnswer && <XCircle size={20} className="text-red-500" />}
                </button>
              );
            })}
          </div>

          {/* Feedback Box */}
          {hasGuessed && (
            <div className="animate-in fade-in zoom-in-95 duration-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 p-5 rounded-2xl">
              <h3 className="text-blue-700 dark:text-blue-300 font-bold mb-1">Did you know?</h3>
              <p className="text-blue-600 dark:text-blue-200 text-sm leading-relaxed">
                The key difference here is in the <span className="font-bold">{currentPair.category}</span>. Listen for that subtle change!
              </p>
            </div>
          )}
        </div>
      </main>

      {/* NO FOOTER */}
    </div>
  );
}
