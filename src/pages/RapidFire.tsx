import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, ArrowRight, XCircle, CheckCircle } from 'lucide-react';
import { useAudio } from '../hooks/useAudio';
import { useUser } from '../store/UserContext';
import { WORD_PAIRS } from '../data/wordPairs';
import { StreakFlame } from '../components/ui/StreakFlame';

export function RapidFire() {
  const { voice, incrementStreak, resetStreak } = useUser();
  const { play } = useAudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);

  // State for the de-duplicated and shuffled list of pairs for the session
  const [shuffledPairs, setShuffledPairs] = useState<(typeof WORD_PAIRS)[0][]>([]);
  // State for the shuffled options for the *current* pair
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  // "Smart Shuffle" Effect: Runs once on mount to create a unique game session
  useEffect(() => {
    // 1. Group by unique pair (e.g., "Bear-Pear") to handle reciprocals
    const groups: Record<string, typeof WORD_PAIRS> = {};
    WORD_PAIRS.forEach(pair => {
      const key = [...pair.options].sort().join('-'); // Creates a consistent key like "Bear-Pear"
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(pair);
    });

    // 2. Pick one random variant from each group (e.g., either "Bear/Pear" or "Pear/Bear")
    const selectedPairs = Object.values(groups).map(group => {
      return group[Math.floor(Math.random() * group.length)];
    });

    // 3. Shuffle the final, unique list for the session
    setShuffledPairs(selectedPairs.sort(() => Math.random() - 0.5));
  }, []);

  // Effect to shuffle answer options whenever the current pair changes
  useEffect(() => {
    if (shuffledPairs.length > 0) {
      const currentPair = shuffledPairs[currentIndex];
      setShuffledOptions([...currentPair.options].sort(() => Math.random() - 0.5));
    }
  }, [currentIndex, shuffledPairs]);


  // Guard Clause: Wait until the session list is prepared
  if (shuffledPairs.length === 0) {
    return <div className="p-10 text-center text-slate-500">Preparing your session...</div>;
  }

  const currentPair = shuffledPairs[currentIndex];
  const hasGuessed = selectedGuess !== null;
  const isCorrect = selectedGuess === currentPair.correct;

  const handleAction = () => {
    if (!hasGuessed) {
      const path = `/hearing-rehab-audio/${voice}_audio/${currentPair.file}.mp3`;
      play(path);
    } else {
      setSelectedGuess(null);
      // Use the length of the de-duplicated list for the modulo
      setCurrentIndex((prev) => (prev + 1) % shuffledPairs.length);
    }
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
        <Link to="/practice" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
          <ArrowLeft size={24} />
        </Link>
        <div className="text-slate-900 dark:text-white font-black text-lg">Word Pairs</div>
        <StreakFlame />
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

        {/* Answer Cards */}
        <div className="space-y-3 mb-8">
          {shuffledOptions.map((option) => {
            const isSelected = selectedGuess === option;
            const isTheCorrectAnswer = option === currentPair.correct;
            
            let cardStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-purple-300 dark:hover:border-purple-700";
            
            if (hasGuessed) {
              if (isTheCorrectAnswer) {
                cardStyle = "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-700 text-green-700 dark:text-green-300 ring-1 ring-green-500/50";
              } else if (isSelected && !isTheCorrectAnswer) {
                cardStyle = "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-700 text-red-700 dark:text-red-400 ring-1 ring-red-500/50";
              } else {
                // The Fix: Ensure contrast for unselected, dimmed items
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
      </main>
    </div>
  );
}
