import { useState, useEffect, useCallback } from 'react';
import { Play, ArrowRight, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWordPairs } from '../hooks/useActivityData';
import { useDetectionData } from '../hooks/useDetectionData';
import { ActivityHeader } from '../components/ui/ActivityHeader';
import { SessionSummary } from '../components/SessionSummary';
import { useProgress } from '../hooks/useProgress';
import { AuraVisualizer } from '../components/AuraVisualizer';
import { HapticButton } from '../components/ui/HapticButton';
import { hapticSuccess, hapticFailure } from '../lib/haptics';
import { useUser } from '../store/UserContext';
import { ActivityBriefing } from '../components/ActivityBriefing';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useSilentSentinel } from '../hooks/useSilentSentinel';
import { getVoiceGender } from '../lib/voiceGender';
import { useTodaysPlan } from '../hooks/useTodaysPlan';
import { getAudioVoiceKey, normalizeTrainingLanguage } from '../lib/trainingLanguage';

const SESSION_LENGTH = 10;

interface DetectionRound {
  id: string;
  hasSound: boolean;
  audioUrl: string | null;
  word: string | null;
  blockType?: string;
}

export function Detection() {
  const navigate = useNavigate();
  const { logProgress } = useProgress();
  const { voice, preferredLanguage, startPracticeSession, endPracticeSession } = useUser();
  const contentLanguage = normalizeTrainingLanguage(preferredLanguage);
  const selectedVoice = getAudioVoiceKey(voice, contentLanguage);
  const usingSpanishDetection = contentLanguage === 'es';
  const { pairs, loading } = useWordPairs(voice || 'sarah');
  const {
    stimuli: detectionStimuli,
    loading: detectionLoading,
    error: detectionError,
  } = useDetectionData({ voiceId: selectedVoice, contentLanguage });
  const { ensureResumed, playUrl } = useSilentSentinel();
  const { nextActivity: planNext, advancePlan, isInPlan } = useTodaysPlan();

  const [hasStarted, setHasStarted] = useState(false);
  const [rounds, setRounds] = useState<DetectionRound[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [audioError, setAudioError] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);

  const currentRound = rounds[currentIndex];
  const hasAnswered = selectedAnswer !== null;

  useEffect(() => {
    if (usingSpanishDetection) {
      if (!detectionLoading && detectionStimuli.length > 0) {
        const shuffled = [...detectionStimuli].sort(() => Math.random() - 0.5).slice(0, SESSION_LENGTH);
        const detectionRounds: DetectionRound[] = shuffled.map((stimulus, i) => {
          const hasSound = Math.random() > 0.3;
          return {
            id: stimulus.id || `detection-es-${i}`,
            hasSound,
            audioUrl: hasSound ? stimulus.audioUrl : null,
            word: hasSound ? stimulus.text : null,
            blockType: stimulus.blockType,
          };
        });
        setRounds(detectionRounds);
        setCurrentIndex(0);
        setStartTime(Date.now());
      }
      return;
    }

    if (!loading && pairs.length > 0) {
      const shuffled = [...pairs].sort(() => Math.random() - 0.5).slice(0, SESSION_LENGTH);
      const detectionRounds: DetectionRound[] = shuffled.map((pair, i) => {
        const hasSound = Math.random() > 0.3;
        const isWord1 = Math.random() > 0.5;
        const word = isWord1 ? pair.word_1 : pair.word_2;
        const audio = isWord1 ? pair.audio_1 : pair.audio_2;

        return {
          id: `detection-${i}`,
          hasSound,
          audioUrl: hasSound ? audio : null,
          word: hasSound ? word : null,
          blockType: 'word_pair',
        };
      });

      setRounds(detectionRounds);
      setCurrentIndex(0);
      setStartTime(Date.now());
    }
  }, [loading, pairs, usingSpanishDetection, detectionLoading, detectionStimuli]);

  useEffect(() => {
    startPracticeSession();
    return () => endPracticeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlay = useCallback(async () => {
    if (!currentRound || isPlaying) return;

    await ensureResumed();
    if (audioPlayed) setReplayCount(prev => prev + 1);
    setIsPlaying(true);
    setStartTime(Date.now());

    if (currentRound.hasSound && currentRound.audioUrl) {
      try {
        setAudioError(false);
        await playUrl(currentRound.audioUrl);
      } catch {
        setAudioError(true);
      }
      setIsPlaying(false);
      setAudioPlayed(true);
    } else {
      const silenceDuration = 1000 + Math.random() * 1000;
      setTimeout(() => {
        setIsPlaying(false);
        setAudioPlayed(true);
      }, silenceDuration);
    }
  }, [currentRound, isPlaying, ensureResumed, playUrl, audioPlayed]);

  const handleAnswer = (userSaidYes: boolean) => {
    if (hasAnswered || !audioPlayed || !currentRound) return;

    const responseTime = Date.now() - startTime;
    const isCorrect = userSaidYes === currentRound.hasSound;

    setSelectedAnswer(userSaidYes);
    setTotal(prev => prev + 1);

    if (isCorrect) {
      setCorrect(prev => prev + 1);
      hapticSuccess();
    } else {
      hapticFailure();
    }

    logProgress({
      contentType: usingSpanishDetection ? 'sentence' : 'word',
      contentId: currentRound.id,
      result: isCorrect ? 'correct' : 'incorrect',
      userResponse: userSaidYes ? 'yes' : 'no',
      correctResponse: currentRound.hasSound ? 'yes' : 'no',
      responseTimeMs: responseTime,
      metadata: {
        activityType: 'detection',
        voiceId: selectedVoice,
        voiceGender: getVoiceGender(selectedVoice),
        contentLanguage,
        word: currentRound.word || undefined,
        hasSound: currentRound.hasSound,
        blockType: currentRound.blockType,
        trialNumber: currentIndex,
        replayCount,
        clinicalCategory: 'detection',
      },
    });
  };

  const handleNext = () => {
    if (currentIndex < rounds.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setAudioPlayed(false);
      setReplayCount(0);
      setStartTime(Date.now());
    } else {
      setIsComplete(true);
    }
  };

  const detectionTitle = usingSpanishDetection ? 'Detección de sonido' : 'Sound Detection';
  const detectionPrompt = usingSpanishDetection ? 'Escuchaste una palabra?' : 'Did you hear a word?';
  const detectionSubtitle = usingSpanishDetection ? 'Escucha con atención y responde Sí o No' : 'Listen carefully, then answer Yes or No';
  const yesLabel = usingSpanishDetection ? 'Sí' : 'Yes';
  const noLabel = usingSpanishDetection ? 'No' : 'No';

  if (!hasStarted) {
    return (
      <ActivityBriefing
        title={detectionTitle}
        description={usingSpanishDetection ? 'Puedes notar cuando aparece una palabra o aviso hablado?' : 'Can you tell when a word is played?'}
        instructions={usingSpanishDetection ? 'Escucharás una palabra o un aviso breve, o bien silencio. Después de escuchar, toca Sí si hubo sonido, o No si fue silencio.' : 'You\'ll hear either a word or silence. After listening, tap Yes if you heard a word, or No if it was silent.'}
        sessionInfo="10 rounds · About 2 minutes"
        onStart={() => { ensureResumed(); setHasStarted(true); }}
      />
    );
  }

  if (isComplete) {
    const finalAccuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <SessionSummary
        sessionTitle={detectionTitle}
        accuracy={finalAccuracy}
        totalItems={total}
        correctCount={correct}
        onContinue={() => {
          if (isInPlan) advancePlan();
          else navigate('/practice');
        }}
        nextActivity={planNext ?? {
          label: 'Word Basics',
          description: 'Tell apart very different words',
          path: '/practice/gross-discrimination',
        }}
      />
    );
  }

  if ((usingSpanishDetection ? detectionLoading : loading) || rounds.length === 0) {
    return <LoadingSpinner message="Loading detection exercises..." />;
  }

  if (usingSpanishDetection && detectionError) {
    return <LoadingSpinner message="Loading detection exercises..." />;
  }

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isCorrectAnswer = hasAnswered && selectedAnswer === currentRound.hasSound;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <motion.header
        animate={{ opacity: isPlaying ? 0.2 : 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50"
      >
        <ActivityHeader title={detectionTitle} backPath="/practice" />
        <div className="text-sm text-slate-500 dark:text-slate-400 mr-14">
          {total > 0 && `${accuracy}% · ${correct}/${total}`}
        </div>
      </motion.header>

      <main className="max-w-lg mx-auto w-full px-6 py-4 flex-1 flex flex-col">
        <motion.div
          animate={{ opacity: isPlaying ? 0.2 : 1 }}
          className="text-center mb-4"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {detectionPrompt}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {detectionSubtitle}
          </p>
        </motion.div>

        {audioError && (
          <p className="text-center text-sm text-red-500 dark:text-red-400 mb-2">Audio failed to load. Tap to retry.</p>
        )}

        <div className="flex justify-center mb-6 relative">
          <AuraVisualizer isPlaying={isPlaying} currentSnr={20} />

          <HapticButton
            onClick={hasAnswered ? handleNext : handlePlay}
            disabled={isPlaying || (audioPlayed && !hasAnswered)}
            className={`w-32 h-32 rounded-full shadow-xl flex items-center justify-center text-white z-10 transition-all ${
              hasAnswered
                ? isCorrectAnswer
                  ? 'bg-teal-500'
                  : 'bg-amber-500'
                : audioPlayed
                  ? 'bg-slate-600 shadow-none opacity-50 cursor-not-allowed'
                  : 'bg-teal-500 hover:bg-teal-400 shadow-xl hover:scale-105'
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

        <AnimatePresence>
          {hasAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center mb-4"
            >
              <p className={`text-lg font-bold ${
                isCorrectAnswer
                  ? 'text-teal-600 dark:text-teal-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {isCorrectAnswer ? 'Correct!' : 'Not quite'}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {currentRound.hasSound
                  ? `The word was "${currentRound.word}"`
                  : 'That was silence'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-4">
          <HapticButton
            onClick={() => handleAnswer(true)}
            disabled={!audioPlayed || hasAnswered}
            aria-label="Yes, I heard a word"
            className={`p-4 rounded-2xl border-2 font-bold text-xl flex flex-col items-center gap-2 transition-all ${
              hasAnswered
                ? selectedAnswer === true
                  ? currentRound.hasSound
                    ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-700 dark:text-teal-300'
                    : 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300'
                  : currentRound.hasSound
                    ? 'bg-teal-50/50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 text-teal-600/50 dark:text-teal-400/50'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 opacity-50'
                : audioPlayed
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check size={32} />
            <span>{yesLabel}</span>
          </HapticButton>

          <HapticButton
            onClick={() => handleAnswer(false)}
            disabled={!audioPlayed || hasAnswered}
            aria-label="No, I did not hear a word"
            className={`p-4 rounded-2xl border-2 font-bold text-xl flex flex-col items-center gap-2 transition-all ${
              hasAnswered
                ? selectedAnswer === false
                  ? !currentRound.hasSound
                    ? 'bg-teal-50 dark:bg-teal-900/30 border-teal-500 text-teal-700 dark:text-teal-300'
                    : 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300'
                  : !currentRound.hasSound
                    ? 'bg-teal-50/50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700 text-teal-600/50 dark:text-teal-400/50'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 opacity-50'
                : audioPlayed
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            <X size={32} />
            <span>{noLabel}</span>
          </HapticButton>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Round {currentIndex + 1} of {rounds.length}</span>
            <span>Erber Level: Detection</span>
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
