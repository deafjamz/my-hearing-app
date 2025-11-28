import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Volume2, Check, X, RefreshCcw } from 'lucide-react';
import { WORD_PAIRS } from '@/data/wordPairs';
import { useAudio } from '@/hooks/useAudio';
import { useUser } from '@/store/UserContext';

// Helper to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function RapidFire() {
  const { play: playAudio, isPlaying } = useAudio();
  const { voice } = useUser(); // Get the selected voice from context

  const [pairs, setPairs] = useState(shuffleArray(WORD_PAIRS));
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const currentPair = pairs[currentPairIndex];

  // Effect to reset state when the component mounts or pairs change
  useEffect(() => {
    setPairs(shuffleArray(WORD_PAIRS));
    setCurrentPairIndex(0);
    setSelectedOption(null);
    setHasGuessed(false);
    setIsCorrect(null);
    setScore(0);
  }, []); // Empty dependency array means this runs once on mount

  const handleOptionSelect = useCallback((option: string) => {
    if (hasGuessed) return; // Don't allow selection after guessing

    setSelectedOption(option);
    setHasGuessed(true);
    
    const correct = option === currentPair.correct;
    setIsCorrect(correct);
    if (correct) {
      setScore(prev => prev + 1);
    }
  }, [currentPair, hasGuessed]);

  const handleNext = useCallback(() => {
    // Reset for the next round
    setSelectedOption(null);
    setHasGuessed(false);
    setIsCorrect(null);

    // Move to the next pair, or reset if at the end
    if (currentPairIndex < pairs.length - 1) {
      setCurrentPairIndex(prev => prev + 1);
    } else {
      // Optionally, reshuffle and restart or show a completion message
      setPairs(shuffleArray(WORD_PAIRS)); // Reshuffle
      setCurrentPairIndex(0); // Reset index
      // Could also add a "Game Over" state here
    }
  }, [currentPairIndex, pairs.length]);

  const playCurrentWord = () => {
    // Construct the audio path using the selected voice and the file from WORD_PAIRS
    const audioPath = `/${voice}/${currentPair.file}.mp3`;
    playAudio(audioPath);
  };

  const playSelectedWord = () => {
    if (!selectedOption) return;
    const audioPath = `/${voice}/${selectedOption.toLowerCase()}.mp3`;
    playAudio(audioPath);
  };

  if (!currentPair) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>; // Or a proper loading state
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between">
        <Link to="/practice" className="flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">Practice</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Score: {score}</span>
          <button onClick={playCurrentWord} className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-50" disabled={isPlaying}>
            <Volume2 size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-8">
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
            Round {currentPairIndex + 1} of {pairs.length}
          </p>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Which word do you hear?</h1>
        </div>

        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          {currentPair.options.map((option) => (
            <button
              key={option}
              onClick={() => handleOptionSelect(option)}
              disabled={hasGuessed}
              className={`w-full py-4 px-6 rounded-[2rem] text-lg font-bold transition-all duration-300
                ${hasGuessed ? (
                  option === currentPair.correct
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 cursor-not-allowed'
                    : selectedOption === option
                      ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 cursor-not-allowed'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                ) : (
                  'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-purple-200 dark:hover:border-purple-800 hover:scale-[1.02]'
                )}
              `}
            >
              {option}
            </button>
          ))}
        </div>
      </main>

      <footer className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent">
        {hasGuessed ? (
          <div className="flex flex-col items-center gap-4">
            {isCorrect ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-5 rounded-2xl w-full text-center">
                <h3 className="text-green-700 dark:text-green-300 font-bold mb-1">Correct!</h3>
                <p className="text-green-600 dark:text-green-200 text-sm leading-relaxed">
                  Nice job distinguishing the sounds. Keep practicing!
                </p>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-5 rounded-2xl w-full">
                <h3 className="text-red-700 dark:text-red-300 font-bold mb-1">Not quite.</h3>
                <p className="text-red-600 dark:text-red-200 text-sm leading-relaxed mb-2">
                  The correct answer was <span className="font-bold">{currentPair.correct}</span>.
                </p>
                <button onClick={playCurrentWord} className="text-red-700 dark:text-red-300 font-bold underline hover:text-red-900 dark:hover:text-red-100 mr-2" disabled={isPlaying}>
                  Listen again: {currentPair.correct}
                </button>
                <button onClick={playSelectedWord} className="text-red-700 dark:text-red-300 font-bold underline hover:text-red-900 dark:hover:text-red-100" disabled={isPlaying}>
                  Listen to your pick: {selectedOption}
                </button>
              </div>
            )}
            {/* Dynamic Feedback Box */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-5 rounded-2xl w-full text-center">
              <h3 className="text-blue-700 dark:text-blue-300 font-bold mb-1">Did you know?</h3>
              <p className="text-blue-600 dark:text-blue-200 text-sm leading-relaxed">
                The key difference here is in the <span className="font-bold">{currentPair.category}</span>. Listen for that subtle change!
              </p>
            </div>
            <button 
              onClick={handleNext} 
              className="w-full py-4 rounded-[2rem] bg-purple-600 text-white font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg active:scale-98"
            >
              {currentPairIndex < pairs.length - 1 ? 'Next Word' : 'Restart Round'}
            </button>
          </div>
        ) : (
          <button 
            onClick={handleNext} 
            disabled={!selectedOption} 
            className="w-full py-4 rounded-[2rem] bg-purple-600 text-white font-bold text-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            Check Answer
          </button>
        )}
      </footer>
    </div>
  );
}
