import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Volume2, VolumeX, RefreshCcw, ArrowRight } from 'lucide-react';
import { WORD_PAIRS } from '@/data/wordPairs';
import { useAudio } from '@/hooks/useAudio';
import { useUser } from '@/store/UserContext';
import { cn } from '@/lib/utils';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export function RapidFire() {
  const { play, isPlaying } = useAudio();
  const { voice, incrementStreak, resetStreak } = useUser(); // Use context

  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isGameActive, setIsGameActive] = useState(true); // Control game flow

  // Shuffle word pairs and select a subset for the game
  const shuffledPairs = useMemo(() => {
    const shuffled = [...WORD_PAIRS].sort(() => 0.5 - Math.random());
    // Filter by voice category, ensuring variety
    const categories = [...new Set(shuffled.map(p => p.category))];
    const selected = [];
    const maxPerCategory = Math.floor(10 / categories.length); // Aim for 10 pairs total

    for (const category of categories) {
      const categoryPairs = shuffled.filter(p => p.category === category);
      selected.push(...categoryPairs.slice(0, maxPerCategory));
    }
    // If we still don't have 10, fill with remaining random pairs
    while (selected.length < 10 && shuffled.length > selected.length) {
      const remaining = shuffled.filter(p => !selected.some(sp => sp.id === p.id));
      if (remaining.length === 0) break;
      selected.push(remaining[0]);
    }
    return selected.slice(0, 10); // Ensure exactly 10
  }, []); // Re-run only on mount

  const currentPair = useMemo(() => shuffledPairs[currentPairIndex], [shuffledPairs, currentPairIndex]);

  const handleAnswer = useCallback((answer: string) => {
    if (!currentPair) return;
    setSelectedAnswer(answer);
    const correct = answer === currentPair.correct;
    setIsAnswerCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      incrementStreak(); // Increment streak on correct answer
    } else {
      resetStreak(); // Reset streak on incorrect answer
    }
  }, [currentPair, incrementStreak, resetStreak]);

  const playSound = useCallback((word: string) => {
    // Construct the path based on voice and word
    const audioPath = `/audio/${voice}/${word.toLowerCase()}.mp3`;
    play(audioPath);
  }, [play, voice]);

  const nextWord = useCallback(() => {
    setShowFeedback(false);
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);
    if (currentPairIndex < shuffledPairs.length - 1) {
      setCurrentPairIndex(prev => prev + 1);
    } else {
      setIsGameActive(false); // End game after last word
    }
  }, [currentPairIndex, shuffledPairs.length]);

  // Preload audio for the current word when it changes
  useEffect(() => {
    if (currentPair && isGameActive) {
      // Play the correct word's sound automatically
      playSound(currentPair.correct);
    }
  }, [currentPair, isGameActive, playSound]);

  // Reset game state when component mounts or isGameActive changes
  useEffect(() => {
    if (isGameActive) {
      setCurrentPairIndex(0);
      setSelectedAnswer(null);
      setIsAnswerCorrect(null);
      setShowFeedback(false);
    }
  }, [isGameActive]);

  if (!currentPair) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-transparent px-4 py-16">
      <AnimatePresence mode="wait">
        {isGameActive ? (
          <motion.div key="game" variants={container} initial="hidden" animate="show" className="w-full max-w-lg mx-auto">
            <motion.header variants={item} className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                <button onClick={() => playSound(currentPair.correct)} className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors" aria-label="Replay sound">
                  {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {currentPair.category}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                {currentPairIndex + 1} / {shuffledPairs.length}
              </span>
            </motion.header>

            <motion.div variants={item} className="text-center mb-12">
              <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
                {currentPair.correct}
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">Which word do you hear?</p>
            </motion.div>

            <motion.div variants={item} className="space-y-4">
              {currentPair.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={showFeedback}
                  className={cn(
                    "w-full p-5 rounded-[2rem] text-left text-lg font-bold transition-all duration-300 shadow-sm",
                    showFeedback ? "cursor-not-allowed" : "cursor-pointer hover:shadow-md",
                    selectedAnswer === option
                      ? isAnswerCorrect
                        ? "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {option}
                </button>
              ))}
            </motion.div>

            {/* Feedback and Next Button Section */}
            <motion.div variants={item} className="mt-8 h-24">
              <AnimatePresence mode="wait">
                {showFeedback && (
                  <motion.div
                    key="feedback"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center h-full"
                  >
                    {isAnswerCorrect ? (
                      <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold">
                        <Check size={20} /> Correct!
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold">
                          <X size={20} /> Incorrect. You heard "{currentPair.correct}".
                        </div>
                      </div>
                    )}
                    <button
                      onClick={nextWord}
                      className="mt-4 px-6 py-3 rounded-full bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      Next Word <ArrowRight size={18} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : (
          // Game Over Screen
          <motion.div key="gameOver" variants={container} initial="hidden" animate="show" className="w-full max-w-lg mx-auto text-center">
            <motion.div variants={item} className="mb-8">
              <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Great Job!</h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                You completed the <span className="font-bold text-purple-600 dark:text-purple-400">{shuffledPairs.length}</span> word challenge.
              </p>
            </motion.div>
            <motion.div variants={item} className="mb-8">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Your current accuracy streak is:
              </p>
              <p className="text-5xl font-black text-purple-600 dark:text-purple-400">
                {currentStreak}
              </p>
            </motion.div>
            <motion.div variants={item} className="flex justify-center gap-4">
              <button
                onClick={() => setIsGameActive(true)}
                className="px-6 py-3 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                Play Again <RefreshCcw size={18} />
              </button>
              <button
                onClick={() => setIsGameActive(true)} // Reset and go to next activity (placeholder)
                className="px-6 py-3 rounded-full bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                Next Activity <ArrowRight size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
