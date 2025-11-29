import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight, XCircle, CheckCircle } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import { useUser } from '../store/UserContext';
import { useWordPairs, WordPair } from '../hooks/useActivityData';
import { ActivityHeader } from '../components/ui/ActivityHeader';

// Game State Interface
interface GameRound {
  pair: WordPair;
  targetWord: string; // The word to identify
  targetAudio: string; // The specific audio for the target
  options: string[]; // [word_1, word_2] shuffled
}

export function RapidFire() {
  const { incrementStreak, resetStreak } = useUser();
  // useAudio now supports { play } which accepts a path
  const { play, isPlaying, error: audioError } = useAudio(); 
  
  const { pairs, loading } = useWordPairs();
  
  const [sessionRounds, setSessionRounds] = useState<GameRound[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);

  // Initialize Game Session
  useEffect(() => {
    if (!loading && pairs.length > 0) {
      // 1. Shuffle the pairs
      const shuffled = [...pairs].sort(() => Math.random() - 0.5);
      
      // 2. Create rounds
      const rounds = shuffled.map(pair => {
        // Randomly pick which word in the pair is the target
        const isWord1Target = Math.random() > 0.5;
        const targetWord = isWord1Target ? pair.word_1 : pair.word_2;
        // Use the correct audio path directly from Supabase
        const targetAudio = isWord1Target ? pair.audio_1 : pair.audio_2; 
        
        return {
          pair,
          targetWord,
          targetAudio,
          options: [pair.word_1, pair.word_2].sort(() => Math.random() - 0.5)
        };
      });
      
      setSessionRounds(rounds);
    }
  }, [loading, pairs]);

  const currentRound = sessionRounds[currentIndex];
  const hasGuessed = selectedGuess !== null;
  const isCorrect = hasGuessed && selectedGuess === currentRound.targetWord;

  const handleAction = () => {
    if (!hasGuessed) {
      // Play audio
      if (currentRound?.targetAudio) {
        play(currentRound.targetAudio);
      } else {
        console.error("No audio source for this round");
      }
    } else {
      // Next Round
      setSelectedGuess(null);
      setCurrentIndex((prev) => (prev + 1) % sessionRounds.length);
    }
  };

  const handleGuess = (guess: string) => {
    if (hasGuessed) return;
    setSelectedGuess(guess);
    if (guess === currentRound.targetWord) {
      incrementStreak();
    } else {
      resetStreak();
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Loading word pairs...</div>;
  }

  if (sessionRounds.length === 0) {
    return <div className="p-10 text-center text-slate-500">No content available.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
        <ActivityHeader title="Word Pairs" backPath="/practice" />
      </header>

      <main className="max-w-lg mx-auto w-full px-6 py-8 flex-1 flex flex-col">
        {/* Unified Action Button */}
        <div className="flex justify-center mb-8">
          <button 
            onClick={handleAction}
            className={`w-28 h-28 rounded-full shadow-xl flex items-center justify-center text-white transition-all duration-300 active:scale-95 ${
              hasGuessed 
                ? 'bg-gradient-to-tr from-green-500 to-green-600 hover:scale-105 shadow-green-500/30' 
                : 'bg-gradient-to-tr from-purple-500 to-purple-600 hover:scale-105 shadow-purple-500/30'
            }`}
          >
            {hasGuessed ? <ArrowRight size={48} /> : <Play size={48} fill="currentColor" className="ml-1" />}
          </button>
        </div>

        <h2 className="text-center text-slate-900 dark:text-white font-bold text-xl mb-6">
          {hasGuessed ? (isCorrect ? "Correct!" : "Nice try!") : "Which word did you hear?"}
        </h2>
        
        {audioError && <p className="text-center text-red-500 mb-4 text-sm">{audioError}</p>}

        {/* Answer Cards */}
        <div className="space-y-3 mb-8">
          {currentRound.options.map((option) => {
            const isSelected = selectedGuess === option;
            const isTheCorrectAnswer = option === currentRound.targetWord;
            
            let cardStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-purple-300 dark:hover:border-purple-700";
            
            if (hasGuessed) {
              if (isTheCorrectAnswer) {
                cardStyle = "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700 text-green-700 dark:text-green-300 ring-1 ring-green-500/50";
              } else if (isSelected && !isTheCorrectAnswer) {
                cardStyle = "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-700 text-red-700 dark:text-red-400 ring-1 ring-red-500/50";
              } else {
                cardStyle = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 opacity-50 grayscale dark:text-slate-500";
              }
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
        
        {/* Helper: Show Tier info */}
        <div className="text-center mt-auto">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                Tier: {currentRound.pair.tier}
            </span>
        </div>
      </main>
    </div>
  );
}