import { useState, useEffect, useCallback } from 'react';
import { Play, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWordPairs, WordPair } from '../hooks/useActivityData';
import { ActivityHeader } from '../components/ui/ActivityHeader';
import { SessionSummary } from '../components/SessionSummary';
import { useProgress } from '../hooks/useProgress';
import { AuraVisualizer } from '../components/AuraVisualizer';
import { HapticButton } from '../components/ui/HapticButton';
import { hapticSuccess, hapticFailure } from '../lib/haptics';
import { useUser } from '../store/UserContext';
import { ActivityBriefing } from '../components/ActivityBriefing';
import { LoadingSpinner } from '../components/LoadingSpinner';

/**
 * Gross Discrimination Activity - Between Detection and Minimal Pairs
 *
 * "Which word did you hear?" with very different options
 * - Presents two words that sound VERY different
 * - Builds confidence before fine discrimination (minimal pairs)
 * - Uses existing word audio but pairs them differently
 *
 * Example pairs:
 * - "cat" vs "elephant" (1 syllable vs 3)
 * - "go" vs "refrigerator" (short vs long)
 * - Words with completely different starting sounds
 */

interface GrossRound {
  id: string;
  targetWord: string;
  targetAudio: string;
  distractorWord: string;
  options: string[]; // Shuffled [target, distractor]
}

/**
 * Create gross discrimination pairs from existing word pairs
 * Strategy: Pair words that are acoustically very different
 */
function createGrossPairs(pairs: WordPair[]): GrossRound[] {
  if (pairs.length < 20) return [];

  // Extract all unique words with their audio
  const words: { word: string; audio: string; syllables: number }[] = [];

  pairs.forEach(pair => {
    if (pair.audio_1) {
      words.push({
        word: pair.word_1,
        audio: pair.audio_1,
        syllables: countSyllables(pair.word_1),
      });
    }
    if (pair.audio_2) {
      words.push({
        word: pair.word_2,
        audio: pair.audio_2,
        syllables: countSyllables(pair.word_2),
      });
    }
  });

  // Remove duplicates
  const uniqueWords = Array.from(
    new Map(words.map(w => [w.word.toLowerCase(), w])).values()
  );

  // Create gross pairs by matching words with different syllable counts
  // or very different starting sounds
  const grossPairs: GrossRound[] = [];
  const used = new Set<string>();

  const shortWords = uniqueWords.filter(w => w.syllables === 1);
  const longWords = uniqueWords.filter(w => w.syllables >= 2);

  // Pair short with long words
  const maxPairs = Math.min(shortWords.length, longWords.length, 50);

  for (let i = 0; i < maxPairs; i++) {
    const short = shortWords[i];
    const long = longWords[i];

    if (used.has(short.word) || used.has(long.word)) continue;

    // Randomly choose which is target
    const isShortTarget = Math.random() > 0.5;
    const target = isShortTarget ? short : long;
    const distractor = isShortTarget ? long : short;

    grossPairs.push({
      id: `gross-${i}`,
      targetWord: target.word,
      targetAudio: target.audio,
      distractorWord: distractor.word,
      options: [target.word, distractor.word].sort(() => Math.random() - 0.5),
    });

    used.add(short.word);
    used.add(long.word);
  }

  // If we don't have enough short/long pairs, create pairs with different starting sounds
  if (grossPairs.length < 30) {
    const remaining = uniqueWords.filter(w => !used.has(w.word));
    const byFirstLetter = new Map<string, typeof remaining>();

    remaining.forEach(w => {
      const first = w.word[0].toLowerCase();
      if (!byFirstLetter.has(first)) {
        byFirstLetter.set(first, []);
      }
      byFirstLetter.get(first)!.push(w);
    });

    // Pair words with very different starting letters
    const letters = Array.from(byFirstLetter.keys());
    for (let i = 0; i < letters.length - 1 && grossPairs.length < 50; i += 2) {
      const group1 = byFirstLetter.get(letters[i]) || [];
      const group2 = byFirstLetter.get(letters[i + 1]) || [];

      if (group1.length > 0 && group2.length > 0) {
        const word1 = group1[0];
        const word2 = group2[0];

        grossPairs.push({
          id: `gross-${grossPairs.length}`,
          targetWord: word1.word,
          targetAudio: word1.audio,
          distractorWord: word2.word,
          options: [word1.word, word2.word].sort(() => Math.random() - 0.5),
        });
      }
    }
  }

  return grossPairs.sort(() => Math.random() - 0.5);
}

/**
 * Simple syllable counter (approximation)
 */
function countSyllables(word: string): number {
  const w = word.toLowerCase();
  if (w.length <= 3) return 1;

  // Count vowel groups
  const vowelGroups = w.match(/[aeiouy]+/gi) || [];
  let count = vowelGroups.length;

  // Adjust for silent e
  if (w.endsWith('e') && count > 1) count--;

  // Minimum 1 syllable
  return Math.max(1, count);
}

const SESSION_LENGTH = 15;

export function GrossDiscrimination() {
  const { logProgress } = useProgress();
  const { voice, startPracticeSession, endPracticeSession } = useUser();
  const navigate = useNavigate();
  const { pairs, loading } = useWordPairs(voice || 'sarah');

  // Briefing state
  const [hasStarted, setHasStarted] = useState(false);

  // Session state
  const [rounds, setRounds] = useState<GrossRound[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Stats
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);

  const currentRound = rounds[currentIndex];
  const hasAnswered = selectedAnswer !== null;
  const isCorrectAnswer = hasAnswered && selectedAnswer === currentRound?.targetWord;

  // Generate rounds
  useEffect(() => {
    if (!loading && pairs.length > 0) {
      const grossRounds = createGrossPairs(pairs).slice(0, SESSION_LENGTH);
      setRounds(grossRounds);
      setCurrentIndex(0);
      setStartTime(Date.now());
    }
  }, [loading, pairs]);

  // Start/end practice session
  useEffect(() => {
    startPracticeSession();
    return () => endPracticeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play audio
  const handlePlay = useCallback(async () => {
    if (!currentRound || isPlaying) return;

    setIsPlaying(true);
    setStartTime(Date.now());

    const audio = new Audio(currentRound.targetAudio);
    audio.onended = () => {
      setIsPlaying(false);
      setAudioPlayed(true);
    };
    audio.onerror = () => {
      console.error('Audio playback error');
      setIsPlaying(false);
      setAudioPlayed(true);
    };
    await audio.play().catch(() => {
      setIsPlaying(false);
      setAudioPlayed(true);
    });
  }, [currentRound, isPlaying]);

  // Handle answer
  const handleAnswer = (answer: string) => {
    if (hasAnswered || !audioPlayed) return;

    const responseTime = Date.now() - startTime;
    const isCorrect = answer === currentRound.targetWord;

    setSelectedAnswer(answer);
    setTotal(prev => prev + 1);

    if (isCorrect) {
      setCorrect(prev => prev + 1);
      hapticSuccess();
    } else {
      hapticFailure();
    }

    // Log progress
    logProgress({
      contentType: 'word',
      contentId: currentRound.id,
      result: isCorrect ? 'correct' : 'incorrect',
      userResponse: answer,
      correctResponse: currentRound.targetWord,
      responseTimeMs: responseTime,
      metadata: {
        voiceId: voice || 'sarah',
        clinicalCategory: 'gross_discrimination',
        difficulty: '1', // Easier than minimal pairs
      },
    });
  };

  // Next round
  const handleNext = () => {
    if (currentIndex < rounds.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setAudioPlayed(false);
      setStartTime(Date.now());
    } else {
      setIsComplete(true);
    }
  };

  if (!hasStarted) {
    return (
      <ActivityBriefing
        title="Word Basics"
        description="Start with words that sound very different."
        instructions="Listen to a word, then pick which one you heard. These words sound quite different from each other — a great warm-up exercise!"
        sessionInfo={`${SESSION_LENGTH} rounds · About 3 minutes`}
        onStart={() => setHasStarted(true)}
      />
    );
  }

  if (isComplete) {
    const finalAccuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <SessionSummary
        sessionTitle="Word Basics"
        accuracy={finalAccuracy}
        totalItems={total}
        correctCount={correct}
        onContinue={() => navigate('/practice')}
      />
    );
  }

  if (loading || rounds.length === 0) {
    return <LoadingSpinner message="Loading exercises..." />;
  }

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <motion.header
        animate={{ opacity: isPlaying ? 0.2 : 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50"
      >
        <ActivityHeader title="Word Basics" backPath="/practice" />
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {total > 0 && `${accuracy}% · ${correct}/${total}`}
        </div>
      </motion.header>

      <main className="max-w-lg mx-auto w-full px-6 py-8 flex-1 flex flex-col">
        {/* Instructions */}
        <motion.div
          animate={{ opacity: isPlaying ? 0.2 : 1 }}
          className="text-center mb-8"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {hasAnswered
              ? isCorrectAnswer
                ? 'Correct!'
                : 'Not quite'
              : 'Which word did you hear?'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {hasAnswered
              ? `The word was "${currentRound.targetWord}"`
              : 'Listen and pick the word you heard'}
          </p>
        </motion.div>

        {/* Play Button with Aura */}
        <div className="flex justify-center mb-10 relative">
          <AuraVisualizer isPlaying={isPlaying} currentSnr={20} />

          <HapticButton
            onClick={hasAnswered ? handleNext : handlePlay}
            disabled={isPlaying || (audioPlayed && !hasAnswered)}
            className={`w-28 h-28 rounded-full shadow-xl flex items-center justify-center text-white z-10 transition-all ${
              hasAnswered
                ? isCorrectAnswer
                  ? 'bg-teal-500'
                  : 'bg-amber-500'
                : 'bg-teal-500 hover:bg-teal-400 hover:scale-105'
            }`}
          >
            {hasAnswered ? (
              <ArrowRight size={48} />
            ) : isPlaying ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-8 h-8 rounded-full bg-white/30"
              />
            ) : (
              <Play size={48} fill="currentColor" className="ml-1" />
            )}
          </HapticButton>
        </div>

        {/* Answer Cards - Large touch targets per design tokens */}
        <div className="space-y-4">
          {currentRound.options.map((option) => {
            const isSelected = selectedAnswer === option;
            const isTheCorrectAnswer = option === currentRound.targetWord;

            let cardStyle =
              'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white';

            if (!audioPlayed) {
              cardStyle =
                'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed';
            } else if (hasAnswered) {
              if (isTheCorrectAnswer) {
                cardStyle =
                  'bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/50';
              } else if (isSelected && !isTheCorrectAnswer) {
                cardStyle =
                  'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-400 ring-1 ring-red-500/50';
              } else {
                cardStyle =
                  'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 opacity-50';
              }
            } else {
              cardStyle +=
                ' hover:border-teal-400 dark:hover:border-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20';
            }

            return (
              <HapticButton
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={!audioPlayed || hasAnswered}
                className={`w-full p-6 text-left font-bold text-2xl rounded-2xl border-2 shadow-sm flex justify-between items-center min-h-[72px] ${cardStyle}`}
              >
                <span>{option}</span>
                {hasAnswered && isTheCorrectAnswer && (
                  <CheckCircle size={28} className="text-teal-600 dark:text-teal-400" />
                )}
                {hasAnswered && isSelected && !isTheCorrectAnswer && (
                  <XCircle size={28} className="text-red-500" />
                )}
              </HapticButton>
            );
          })}
        </div>

        {/* Progress */}
        <div className="mt-auto pt-8">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Round {currentIndex + 1} of {rounds.length}</span>
            <span>Erber Level: Basic Discrimination</span>
          </div>
          <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / rounds.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
