import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Play, Check, Volume2, ChevronRight, Ear, ArrowRight, ArrowLeftRight, Target, MessageSquare } from 'lucide-react';
import { useWordPairs, type WordPair } from '@/hooks/useActivityData';
import { useSentenceData, getAudioUrl, type SentenceWithAudio } from '@/hooks/useSentenceData';
import { useSilentSentinel } from '@/hooks/useSilentSentinel';
import { useProgress } from '@/hooks/useProgress';
import { useUser } from '@/store/UserContext';
import { getVoiceGender } from '@/lib/voiceGender';
import { buildWordAudioUrl } from '@/lib/audio';
import { hapticSelection, hapticSuccess, hapticFailure } from '@/lib/haptics';
import { Button, Card } from '@/components/primitives';

// --- Constants ---

const PLACEMENT_KEY = 'soundsteps_placement';
const ERBER_LEVELS = ['detection', 'discrimination', 'identification', 'comprehension'] as const;
type ErberLevel = typeof ERBER_LEVELS[number];

interface TrialDef {
  level: ErberLevel;
  index: number; // trial index within this level (0-based)
}

// 10 trials: 2 detection, 3 discrimination, 3 identification, 2 comprehension
const TRIAL_SEQUENCE: TrialDef[] = [
  { level: 'detection', index: 0 },
  { level: 'detection', index: 1 },
  { level: 'discrimination', index: 0 },
  { level: 'discrimination', index: 1 },
  { level: 'discrimination', index: 2 },
  { level: 'identification', index: 0 },
  { level: 'identification', index: 1 },
  { level: 'identification', index: 2 },
  { level: 'comprehension', index: 0 },
  { level: 'comprehension', index: 1 },
];

const LEVEL_ICONS: Record<ErberLevel, React.ComponentType<{ className?: string; size?: number }>> = {
  detection: Ear,
  discrimination: ArrowLeftRight,
  identification: Target,
  comprehension: MessageSquare,
};

const LEVEL_INFO: Record<ErberLevel, { title: string; description: string; nextHint: string }> = {
  detection: {
    title: 'Detection',
    description: 'Can you tell when a sound is present?',
    nextHint: 'You noticed sounds. Now let\'s try telling words apart.',
  },
  discrimination: {
    title: 'Discrimination',
    description: 'Can you tell two different words apart?',
    nextHint: 'Now let\'s try with similar-sounding words.',
  },
  identification: {
    title: 'Identification',
    description: 'Can you recognize similar-sounding words?',
    nextHint: 'Finally, let\'s try understanding sentences.',
  },
  comprehension: {
    title: 'Comprehension',
    description: 'Can you understand the meaning of sentences?',
    nextHint: '',
  },
};

// --- Types ---

type Phase = 'intro' | 'trial' | 'interstitial' | 'results';

interface LevelScore {
  correct: number;
  total: number;
  accuracy: number;
}

interface PlacementResult {
  completedAt: string;
  level: string;
  scores: Record<ErberLevel, LevelScore>;
  version: '1.0';
}

// --- Placement Logic ---

function determineStartingLevel(scores: Record<ErberLevel, LevelScore>): ErberLevel {
  const acc = (level: ErberLevel) =>
    scores[level].total > 0 ? scores[level].correct / scores[level].total : 0;
  if (acc('detection') < 0.8) return 'detection';
  if (acc('discrimination') < 0.6) return 'discrimination';
  if (acc('identification') < 0.6) return 'identification';
  return 'comprehension';
}

// --- Component ---

export function PlacementAssessment() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { voice } = useUser();
  const { ensureResumed, playUrl, stopPlayback } = useSilentSentinel();
  const { logProgress } = useProgress();

  // Data hooks
  const { pairs, loading: pairsLoading } = useWordPairs(voice);
  const { sentences: rawSentences, loading: sentencesLoading, error: sentencesError } = useSentenceData({ limit: 4, voiceId: voice });

  // Filter out sentences with null clinical_metadata (some DB rows lack it)
  const sentences = useMemo(
    () => rawSentences.filter(s => s.clinical_metadata?.correct_answer),
    [rawSentences]
  );

  // Debug: log loading states in dev
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[Placement] voice:', voice, 'pairsLoading:', pairsLoading, 'pairs:', pairs.length,
        'sentencesLoading:', sentencesLoading, 'sentences:', sentences.length, 'error:', sentencesError);
    }
  }, [voice, pairsLoading, pairs.length, sentencesLoading, sentences.length, sentencesError]);

  // State machine
  const [phase, setPhase] = useState<Phase>('intro');
  const [trialIndex, setTrialIndex] = useState(0);
  const [scores, setScores] = useState<Record<ErberLevel, LevelScore>>({
    detection: { correct: 0, total: 0, accuracy: 0 },
    discrimination: { correct: 0, total: 0, accuracy: 0 },
    identification: { correct: 0, total: 0, accuracy: 0 },
    comprehension: { correct: 0, total: 0, accuracy: 0 },
  });
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const trialStartRef = useRef<number>(0);

  const dataLoading = pairsLoading || sentencesLoading;
  const currentTrial = TRIAL_SEQUENCE[trialIndex];
  const totalTrials = TRIAL_SEQUENCE.length;

  // --- Prepare trial data ---

  // Shuffle pairs into buckets by category for discrimination vs identification
  const { detectionPairs, discriminationPairs, identificationPairs } = useMemo(() => {
    if (pairs.length === 0) return { detectionPairs: [], discriminationPairs: [], identificationPairs: [] };

    // Fisher-Yates shuffle
    const shuffled = [...pairs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Detection: any 2 pairs (we only use word_1 audio)
    const detectionPairs = shuffled.slice(0, 2);

    // Discrimination: pick pairs from different categories (very different words)
    const categories = new Map<string, WordPair[]>();
    for (const p of shuffled) {
      const cat = p.clinical_category || 'General';
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(p);
    }
    const catKeys = [...categories.keys()];
    const discriminationPairs: WordPair[] = [];
    // Pick 3 pairs where word_1 and word_2 come from different pairs (very different)
    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      discriminationPairs.push(shuffled[2 + i] || shuffled[i]);
    }

    // Identification: pick pairs from same category (similar phoneme contrasts)
    const identificationPairs: WordPair[] = [];
    for (let i = 0; i < Math.min(3, shuffled.length); i++) {
      identificationPairs.push(shuffled[5 + i] || shuffled[i]);
    }

    return { detectionPairs, discriminationPairs, identificationPairs };
  }, [pairs]);

  // Detection: randomly decide if sound plays or silence
  const detectionHasSound = useMemo(
    () => [Math.random() > 0.5, Math.random() > 0.5],
    []
  );

  // --- Audio playback ---

  const playTrialAudio = useCallback(async () => {
    if (!currentTrial) return;
    setIsPlaying(true);
    setHasPlayed(true);
    trialStartRef.current = Date.now();

    try {
      await ensureResumed();

      if (currentTrial.level === 'detection') {
        const pair = detectionPairs[currentTrial.index];
        if (!pair) return;
        if (detectionHasSound[currentTrial.index]) {
          await playUrl(pair.audio_1);
        } else {
          // Silence — wait 1.5s
          await new Promise(r => setTimeout(r, 1500));
        }
      } else if (currentTrial.level === 'discrimination' || currentTrial.level === 'identification') {
        const pool = currentTrial.level === 'discrimination' ? discriminationPairs : identificationPairs;
        const pair = pool[currentTrial.index];
        if (!pair) return;
        // Play word_1 audio
        await playUrl(pair.audio_1);
      } else if (currentTrial.level === 'comprehension') {
        const sentence = sentences[currentTrial.index];
        if (!sentence || sentence.audio_assets.length === 0) return;
        const audioPath = sentence.audio_assets[0].storage_path;
        await playUrl(getAudioUrl(audioPath));
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error('Placement audio error:', err);
    } finally {
      setIsPlaying(false);
    }
  }, [currentTrial, detectionPairs, discriminationPairs, identificationPairs, sentences, detectionHasSound, ensureResumed, playUrl]);

  // --- Answer handling ---

  const handleAnswer = useCallback(async (answer: string) => {
    if (!currentTrial || feedback) return;
    const responseTimeMs = Date.now() - trialStartRef.current;

    let isCorrect = false;

    if (currentTrial.level === 'detection') {
      const hasSound = detectionHasSound[currentTrial.index];
      isCorrect = (answer === 'yes') === hasSound;
    } else if (currentTrial.level === 'discrimination' || currentTrial.level === 'identification') {
      const pool = currentTrial.level === 'discrimination' ? discriminationPairs : identificationPairs;
      const pair = pool[currentTrial.index];
      if (pair) {
        isCorrect = answer === pair.word_1;
      }
    } else if (currentTrial.level === 'comprehension') {
      const sentence = sentences[currentTrial.index];
      if (sentence?.clinical_metadata) {
        isCorrect = answer === sentence.clinical_metadata.correct_answer;
      }
    }

    // Update scores
    setScores(prev => {
      const level = currentTrial.level;
      const newCorrect = prev[level].correct + (isCorrect ? 1 : 0);
      const newTotal = prev[level].total + 1;
      return {
        ...prev,
        [level]: {
          correct: newCorrect,
          total: newTotal,
          accuracy: Math.round((newCorrect / newTotal) * 100),
        },
      };
    });

    // Haptic feedback
    if (isCorrect) hapticSuccess(); else hapticFailure();

    // Show feedback
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    // Log progress
    const pair = currentTrial.level === 'detection'
      ? detectionPairs[currentTrial.index]
      : currentTrial.level === 'discrimination'
        ? discriminationPairs[currentTrial.index]
        : currentTrial.level === 'identification'
          ? identificationPairs[currentTrial.index]
          : null;
    const sentence = currentTrial.level === 'comprehension' ? sentences[currentTrial.index] : null;

    logProgress({
      contentType: currentTrial.level === 'comprehension' ? 'sentence' : 'word',
      contentId: sentence?.id || pair?.id || `placement-${trialIndex}`,
      result: isCorrect ? 'correct' : 'incorrect',
      userResponse: answer,
      correctResponse: currentTrial.level === 'detection'
        ? (detectionHasSound[currentTrial.index] ? 'yes' : 'no')
        : currentTrial.level === 'comprehension'
          ? sentence?.clinical_metadata?.correct_answer
          : pair?.word_1,
      responseTimeMs,
      metadata: {
        activityType: 'placement',
        trialNumber: trialIndex + 1,
        voiceId: voice || 'sarah',
        voiceGender: getVoiceGender(voice || 'sarah'),
        erberLevel: currentTrial.level,
        word: pair?.word_1,
      },
    });

    // Auto-advance after 1.2s
    setTimeout(() => {
      setFeedback(null);
      setHasPlayed(false);
      const nextIndex = trialIndex + 1;

      if (nextIndex >= totalTrials) {
        // Assessment complete — show results
        setPhase('results');
        return;
      }

      const nextTrial = TRIAL_SEQUENCE[nextIndex];
      // Check if we're entering a new level — show interstitial
      if (nextTrial.level !== currentTrial.level) {
        setTrialIndex(nextIndex);
        setPhase('interstitial');
      } else {
        setTrialIndex(nextIndex);
      }
    }, 1200);
  }, [currentTrial, feedback, trialIndex, totalTrials, detectionHasSound, detectionPairs, discriminationPairs, identificationPairs, sentences, logProgress, voice]);

  // --- Save results ---

  useEffect(() => {
    if (phase !== 'results') return;
    const result: PlacementResult = {
      completedAt: new Date().toISOString(),
      level: determineStartingLevel(scores),
      scores,
      version: '1.0',
    };
    localStorage.setItem(PLACEMENT_KEY, JSON.stringify(result));
  }, [phase, scores]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  // --- Get choice options for current trial ---

  const getChoices = (): { label: string; value: string }[] => {
    if (!currentTrial) return [];

    if (currentTrial.level === 'detection') {
      return [
        { label: 'Yes, I heard it', value: 'yes' },
        { label: 'No sound', value: 'no' },
      ];
    }

    if (currentTrial.level === 'discrimination' || currentTrial.level === 'identification') {
      const pool = currentTrial.level === 'discrimination' ? discriminationPairs : identificationPairs;
      const pair = pool[currentTrial.index];
      if (!pair) return [];
      // Randomize order
      const options = [
        { label: pair.word_1, value: pair.word_1 },
        { label: pair.word_2, value: pair.word_2 },
      ];
      return Math.random() > 0.5 ? options : options.reverse();
    }

    if (currentTrial.level === 'comprehension') {
      const sentence = sentences[currentTrial.index];
      if (!sentence?.clinical_metadata) return [];
      const m = sentence.clinical_metadata;
      const all = [
        m.correct_answer,
        m.distractor_1,
        m.distractor_2,
        m.distractor_3,
      ].filter(Boolean) as string[];
      // Fisher-Yates shuffle
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      return all.map(a => ({ label: a, value: a }));
    }

    return [];
  };

  // Memoize choices to prevent re-shuffle on re-render
  const choices = useMemo(() => {
    return getChoices();
    // Intentionally re-compute when trial changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trialIndex, pairs, sentences]);

  // --- Animation config ---
  const fadeIn = prefersReducedMotion
    ? { initial: false as const, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

  const recommendedLevel = phase === 'results' ? determineStartingLevel(scores) : null;

  // --- Render ---

  // Loading state
  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
        {sentencesError && (
          <p className="text-red-400 text-sm text-center px-6">
            Error loading sentences: {sentencesError}
          </p>
        )}
      </div>
    );
  }

  // Insufficient data guard
  if (pairs.length < 8 || sentences.length < 2) {
    return (
      <div className="max-w-md mx-auto px-6 pt-20 text-center">
        <p className="text-slate-400 text-sm">
          Not enough practice content available right now. Please try again later.
        </p>
        <Button
          size="md"
          onClick={() => navigate('/practice')}
          className="mt-6"
        >
          Go to Practice Hub
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 pt-8 pb-20 min-h-screen">
      <AnimatePresence mode="wait">
        {/* ==================== INTRO ==================== */}
        {phase === 'intro' && (
          <motion.div
            key="intro"
            {...fadeIn}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
            className="flex flex-col items-center text-center pt-12"
          >
            <img src="/logo.png" alt="SoundSteps" className="w-20 h-20 rounded-2xl mb-6" />

            <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
              Let's Find Your Starting Point
            </h1>

            <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-xs">
              You'll try 10 quick listening exercises — from simple detection to full sentences.
              This helps us personalize your training.
            </p>

            {/* Level preview */}
            <Card padding="p-5" className="w-full mb-8 text-left space-y-3">
              {ERBER_LEVELS.map((level) => {
                const Icon = LEVEL_ICONS[level];
                return (
                  <div key={level} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">{LEVEL_INFO[level].title}</p>
                      <p className="text-slate-500 text-xs">{LEVEL_INFO[level].description}</p>
                    </div>
                  </div>
                );
              })}
            </Card>

            <Button
              size="lg"
              onClick={async () => {
                await ensureResumed();
                hapticSelection();
                setPhase('trial');
              }}
              className="shadow-lg rounded-2xl flex items-center justify-center gap-2"
            >
              <Play size={20} fill="currentColor" />
              Start Listening Check
            </Button>

            <p className="text-slate-500 text-sm mt-3">About 3 minutes</p>
          </motion.div>
        )}

        {/* ==================== TRIAL ==================== */}
        {phase === 'trial' && currentTrial && (
          <motion.div
            key={`trial-${trialIndex}`}
            {...fadeIn}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="flex flex-col items-center pt-4"
          >
            {/* Progress bar */}
            <div className="w-full mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  {LEVEL_INFO[currentTrial.level].title}
                </span>
                <span className="text-xs text-slate-500">
                  {trialIndex + 1} of {totalTrials}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-teal-500 rounded-full"
                  initial={{ width: `${(trialIndex / totalTrials) * 100}%` }}
                  animate={{ width: `${((trialIndex + 1) / totalTrials) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Prompt text */}
            <p className="text-slate-400 text-sm text-center mt-6 mb-8">
              {currentTrial.level === 'detection' && 'Listen carefully. Did you hear a word?'}
              {currentTrial.level === 'discrimination' && 'Listen to the word. Which one did you hear?'}
              {currentTrial.level === 'identification' && 'Listen carefully. Which word was it?'}
              {currentTrial.level === 'comprehension' && (hasPlayed ? 'Answer the question below.' : 'Listen to the sentence, then answer the question.')}
            </p>

            {/* Play button */}
            <button
              onClick={playTrialAudio}
              disabled={isPlaying}
              className="w-24 h-24 rounded-full bg-teal-500/20 border-2 border-teal-500/40 flex items-center justify-center mb-4 hover:bg-teal-500/30 transition-colors disabled:opacity-50"
            >
              {isPlaying ? (
                <div className="w-6 h-6 border-3 border-teal-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Volume2 className="w-10 h-10 text-teal-400" />
              )}
            </button>

            <p className="text-slate-500 text-xs mb-8">
              {hasPlayed ? 'Tap to replay' : 'Tap to listen'}
            </p>

            {/* Comprehension question text */}
            {currentTrial.level === 'comprehension' && hasPlayed && sentences[currentTrial.index] && (
              <Card padding="p-4" className="w-full mb-6">
                <p className="text-white text-base font-bold text-center">
                  {sentences[currentTrial.index].clinical_metadata?.question_text || 'What did you hear?'}
                </p>
              </Card>
            )}

            {/* Choice buttons */}
            {hasPlayed && (
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`w-full ${choices.length <= 2 ? 'space-y-3' : 'grid grid-cols-2 gap-3'}`}
              >
                {choices.map((choice) => {
                  const isSelected = feedback !== null;
                  let btnClass = 'w-full py-4 px-6 rounded-2xl font-bold text-base transition-all border ';

                  if (feedback === 'correct' && choice.value === (
                    currentTrial.level === 'detection'
                      ? (detectionHasSound[currentTrial.index] ? 'yes' : 'no')
                      : currentTrial.level === 'comprehension'
                        ? sentences[currentTrial.index]?.clinical_metadata?.correct_answer
                        : (currentTrial.level === 'discrimination' ? discriminationPairs : identificationPairs)[currentTrial.index]?.word_1
                  )) {
                    btnClass += 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
                  } else if (feedback === 'incorrect' && choice.value === (
                    currentTrial.level === 'detection'
                      ? (detectionHasSound[currentTrial.index] ? 'yes' : 'no')
                      : currentTrial.level === 'comprehension'
                        ? sentences[currentTrial.index]?.clinical_metadata?.correct_answer
                        : (currentTrial.level === 'discrimination' ? discriminationPairs : identificationPairs)[currentTrial.index]?.word_1
                  )) {
                    // Show correct answer highlighted in green on wrong answer
                    btnClass += 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
                  } else if (isSelected) {
                    btnClass += 'bg-slate-800/50 border-slate-700 text-slate-500';
                  } else {
                    btnClass += 'bg-slate-800 border-slate-700 text-white hover:border-teal-500/50 hover:bg-slate-700';
                  }

                  return (
                    <button
                      key={choice.value}
                      onClick={() => handleAnswer(choice.value)}
                      disabled={feedback !== null}
                      className={btnClass}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* Feedback indicator */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-6"
                >
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                    feedback === 'correct'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {feedback === 'correct' ? <Check size={16} /> : null}
                    <span className="text-sm font-bold">
                      {feedback === 'correct' ? 'Correct' : 'Not quite'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ==================== INTERSTITIAL ==================== */}
        {phase === 'interstitial' && currentTrial && (
          <motion.div
            key={`inter-${currentTrial.level}`}
            {...fadeIn}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
            className="flex flex-col items-center text-center pt-16"
          >
            {/* Completed levels */}
            <div className="space-y-3 mb-8 w-full max-w-xs">
              {ERBER_LEVELS.map((level) => {
                const levelIdx = ERBER_LEVELS.indexOf(level);
                const currentLevelIdx = ERBER_LEVELS.indexOf(currentTrial.level);
                const isCompleted = levelIdx < currentLevelIdx;
                const isCurrent = levelIdx === currentLevelIdx;

                if (!isCompleted && !isCurrent) return null;

                return (
                  <div
                    key={level}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      isCompleted ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-teal-500/10 border border-teal-500/30'
                    }`}
                  >
                    {isCompleted ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-teal-400" />
                      </div>
                    )}
                    <div className="text-left">
                      <p className={`text-sm font-bold ${isCompleted ? 'text-emerald-400' : 'text-teal-400'}`}>
                        {LEVEL_INFO[level].title}
                      </p>
                      {isCompleted && scores[level].total > 0 && (
                        <p className="text-emerald-500/60 text-xs">
                          {scores[level].correct}/{scores[level].total} correct
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Transition message */}
            <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-xs">
              {(() => {
                const prevLevelIdx = ERBER_LEVELS.indexOf(currentTrial.level) - 1;
                if (prevLevelIdx >= 0) {
                  return LEVEL_INFO[ERBER_LEVELS[prevLevelIdx]].nextHint;
                }
                return '';
              })()}
            </p>

            <Button
              size="lg"
              onClick={() => { hapticSelection(); setPhase('trial'); }}
              className="rounded-2xl flex items-center justify-center gap-2"
            >
              Continue
              <ChevronRight size={20} />
            </Button>
          </motion.div>
        )}

        {/* ==================== RESULTS ==================== */}
        {phase === 'results' && recommendedLevel && (
          <motion.div
            key="results"
            {...fadeIn}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
            className="flex flex-col items-center pt-8"
          >
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-teal-400" />
            </div>

            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Listening Check Complete
            </h1>
            <p className="text-slate-400 text-sm text-center mb-8">
              Here's how you did across all four levels
            </p>

            {/* Score breakdown */}
            <div className="w-full space-y-4 mb-8">
              {ERBER_LEVELS.map((level) => {
                const score = scores[level];
                const isRecommended = level === recommendedLevel;
                return (
                  <div
                    key={level}
                    className={`p-4 rounded-2xl border ${
                      isRecommended
                        ? 'bg-teal-500/10 border-teal-500/30'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {(() => { const Icon = LEVEL_ICONS[level]; return <Icon className="w-4 h-4 text-slate-400" size={16} />; })()}
                        <span className="text-white font-bold text-sm">{LEVEL_INFO[level].title}</span>
                        {isRecommended && (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-teal-500 text-white">
                            Start Here
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-bold ${
                        score.accuracy >= 80 ? 'text-emerald-400' :
                        score.accuracy >= 60 ? 'text-amber-400' :
                        'text-slate-400'
                      }`}>
                        {score.total > 0 ? `${score.correct}/${score.total}` : '—'}
                      </span>
                    </div>

                    {/* Progress bar */}
                    {score.total > 0 && (
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            score.accuracy >= 80 ? 'bg-emerald-500' :
                            score.accuracy >= 60 ? 'bg-amber-500' :
                            'bg-slate-600'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${score.accuracy}%` }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Recommendation */}
            <Card padding="p-5" className="w-full mb-8">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                Recommended Starting Level
              </p>
              <p className="text-white font-bold text-lg mb-1">
                {LEVEL_INFO[recommendedLevel].title}
              </p>
              <p className="text-slate-400 text-sm">
                {recommendedLevel === 'detection' && 'We\'ll start with sound awareness exercises to build a strong foundation.'}
                {recommendedLevel === 'discrimination' && 'You\'re ready to practice telling different words apart.'}
                {recommendedLevel === 'identification' && 'You can tell words apart well — let\'s work on recognizing similar sounds.'}
                {recommendedLevel === 'comprehension' && 'Strong listening skills! Let\'s focus on understanding full sentences and conversations.'}
              </p>
            </Card>

            <Button
              size="lg"
              onClick={() => { hapticSelection(); navigate('/practice'); }}
              className="shadow-lg rounded-2xl flex items-center justify-center gap-2"
            >
              Start Training
              <ArrowRight size={20} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
