import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, ArrowRight, XCircle, CheckCircle, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSNRMixer } from '../hooks/useSNRMixer';
import { useUser } from '../store/UserContext';
import { useWordPairs, WordPair } from '../hooks/useActivityData';
import { ActivityHeader } from '../components/ui/ActivityHeader';
import { useProgress } from '../hooks/useProgress';
import { SmartCoachFeedback } from '../components/SmartCoachFeedback';
import { SessionSummary } from '../components/SessionSummary';
import { AuraVisualizer } from '../components/AuraVisualizer';
import { HapticButton } from '../components/ui/HapticButton';
import { hapticSuccess, hapticFailure } from '../lib/haptics';
import { evaluateSession, getClinicalBabble, getUserSNR, saveUserSNR, SNR_DEFAULT, BLOCK_SIZE } from '../lib/api';
import { ActivityBriefing } from '../components/ActivityBriefing';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { getVoiceGender } from '../lib/voiceGender';
import { useTodaysPlan } from '../hooks/useTodaysPlan';

/** UI-level coach action type (capitalized), matching SmartCoachFeedbackProps */
type CoachUIAction = 'Increase' | 'Decrease' | 'Keep' | 'Enable Noise' | 'Step Down';

/** UI-level coach response with capitalized action strings */
interface CoachUIResponse {
  recommendation: string;
  action: CoachUIAction;
  accuracy: number;
  next_snr: number;
}

// Game State Interface
interface GameRound {
  pair: WordPair;
  targetWord: string; // The word to identify
  targetAudio: string; // The specific audio for the target
  options: string[]; // [word_1, word_2] shuffled
}

const SESSION_LENGTH = 10;

export function RapidFire() {
  const { logProgress } = useProgress();
  const { voice, startPracticeSession, endPracticeSession, user, hardMode, hasAccess } = useUser();
  const navigate = useNavigate();
  const { nextActivity: planNext, advancePlan, isInPlan } = useTodaysPlan();

  // Force 'sarah' if no voice is found (e.g. user is logged out)
  const { pairs, loading } = useWordPairs(voice || 'sarah');

  // Briefing state
  const [hasStarted, setHasStarted] = useState(false);

  // Session state
  const [sessionRounds, setSessionRounds] = useState<GameRound[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [audioPlayedForRound, setAudioPlayedForRound] = useState(false);

  // Smart Coach state
  const [trialHistory, setTrialHistory] = useState<boolean[]>([]);
  const [currentSNR, setCurrentSNR] = useState<number>(SNR_DEFAULT);
  const [babbleUrl, setBabbleUrl] = useState<string>('');
  const [showCoachFeedback, setShowCoachFeedback] = useState(false);
  const [coachResponse, setCoachResponse] = useState<CoachUIResponse | null>(null);

  // Replay tracking
  const [replayCount, setReplayCount] = useState(0);

  // Noise toggle (Silent Sentinel per 00_MASTER_RULES.md Section 6)
  const [noiseEnabled, setNoiseEnabled] = useState(false); // Default OFF (Consumer Model)

  // Debug logging (dev only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[RapidFire] Loading:', loading, '| Pairs:', pairs.length, '| Voice:', voice || 'sarah');
    }
  }, [loading, pairs.length, voice]);

  // Derive current round from session state
  const currentRound = sessionRounds[currentIndex];

  // SNR Mixer - Silent Sentinel Mode (always-on audio to prevent Bluetooth beeps)
  const { startNoise, stopNoise, playTarget, isNoiseRunning, isTargetPlaying, isLoading: audioLoading, error: audioError, setSNR, setNoiseEnabled: setMixerNoiseEnabled, resumeAudio, audioContextState } = useSNRMixer({
    noiseUrl: babbleUrl,
    initialSNR: currentSNR,
    noiseEnabled, // User-controlled toggle (default OFF)
  });

  // Load babble and user's SNR on mount
  useEffect(() => {
    const loadSmartCoachAssets = async () => {
      try {
        // Load clinical babble
        const babble = await getClinicalBabble();
        if (babble) {
          setBabbleUrl(babble);
        } else {
          console.warn('No clinical babble found - continuing without noise');
        }

        // Load user's saved SNR level
        if (user?.id) {
          const userSNR = await getUserSNR(user.id);
          setCurrentSNR(userSNR);
          setSNR(userSNR); // Update mixer
        }
      } catch (err) {
        console.error('Failed to load Smart Coach assets:', err);
      }
    };

    loadSmartCoachAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Start & Stop Practice Session on mount/unmount
  useEffect(() => {
    startPracticeSession();
    return () => {
      stopNoise(); // Stop audio when leaving
      endPracticeSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize Game Session
  useEffect(() => {
    if (!loading && pairs.length > 0) {
      // Filter pairs by tier - free users only get free-tier pairs
      const accessiblePairs = pairs.filter(pair => {
        const tier = pair.tier?.toLowerCase();
        if (!tier || tier === 'free') return true;
        if (tier === 'standard') return hasAccess('Standard');
        if (tier === 'premium') return hasAccess('Premium');
        return true;
      });

      const shuffled = [...(accessiblePairs.length > 0 ? accessiblePairs : pairs)].sort(() => Math.random() - 0.5).slice(0, SESSION_LENGTH);

      const rounds = shuffled.map(pair => {
        const isWord1Target = Math.random() > 0.5;
        const targetWord = isWord1Target ? pair.word_1 : pair.word_2;
        const targetAudio = isWord1Target ? pair.audio_1 : pair.audio_2;

        return {
          pair,
          targetWord,
          targetAudio,
          options: Math.random() > 0.5 ? [pair.word_1, pair.word_2] : [pair.word_2, pair.word_1]
        };
      });

      setSessionRounds(rounds);
      setCurrentIndex(0); // Ensure starting at 0
      setStartTime(Date.now());
      setAudioPlayedForRound(false); // Reset for new session
    }
  }, [loading, pairs]);

  // Start continuous noise when session is ready
  useEffect(() => {
    const initAudio = async () => {
      if (sessionRounds.length > 0 && babbleUrl && !isNoiseRunning && !audioLoading) {
        // Mobile: Resume AudioContext before first audio operation
        await resumeAudio();
        startNoise();
      }
    };
    initAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionRounds.length, babbleUrl, audioLoading]);

  // Reset audioPlayedForRound when round changes
  useEffect(() => {
    setAudioPlayedForRound(false);
  }, [currentIndex]);

  // Toggle noise handler (Silent Sentinel vs Audible)
  const handleNoiseToggle = () => {
    const newState = !noiseEnabled;
    setNoiseEnabled(newState);
    setMixerNoiseEnabled(newState);
  };

  const hasGuessed = selectedGuess !== null;
  const isCorrect = hasGuessed && currentRound && selectedGuess === currentRound.targetWord;

  const handleAction = async () => {
    // Haptic feedback is now handled by HapticButton

    if (!hasGuessed) {
      if (currentRound?.targetAudio) {
        // Mobile: Resume AudioContext on first user interaction
        await resumeAudio();
        if (audioPlayedForRound) setReplayCount(prev => prev + 1);
        playTarget(currentRound.targetAudio); // Play word on top of continuous noise
        setAudioPlayedForRound(true); // Mark audio as played for this round
      } else {
        console.error("No audio source for this round");
      }
    } else {
      setSelectedGuess(null);
      setReplayCount(0);
      if (currentIndex < sessionRounds.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setStartTime(Date.now());
      } else {
          stopNoise();
          setIsComplete(true);
      }
    }
  };

  const handleGuess = async (guess: string) => {
    if (hasGuessed || !audioPlayedForRound) return; // Prevent guess if audio not played
    setSelectedGuess(guess);

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const correct = guess === currentRound.targetWord;

    // Tactile feedback based on correctness
    if (correct) {
      hapticSuccess(); // Crisp, light tap
    } else {
      hapticFailure(); // Heavy, dull buzz
    }

    // Track result for Smart Coach
    const newHistory = [...trialHistory, correct];
    setTrialHistory(newHistory);

    // Log progress
    logProgress({
        contentType: 'word',
        contentId: currentRound.pair.id,
        result: correct ? 'correct' : 'incorrect',
        userResponse: guess,
        correctResponse: currentRound.targetWord,
        responseTimeMs: responseTime,
        metadata: {
            activityType: 'rapid_fire',
            targetPhoneme: currentRound.pair.target_phoneme,
            contrastPhoneme: currentRound.pair.contrast_phoneme,
            position: currentRound.pair.position,
            vowelContext: currentRound.pair.vowel_context,
            clinicalCategory: currentRound.pair.clinical_category,
            voiceId: voice,
            voiceGender: getVoiceGender(voice || 'sarah'),
            snr: currentSNR,
            noiseEnabled,
            trialNumber: currentIndex,
            replayCount,
            tier: currentRound.pair.tier,
        }
    });

    // Smart Coach: Evaluate every BLOCK_SIZE trials (per 10_CLINICAL_CONSTANTS.md)
    if (newHistory.length % BLOCK_SIZE === 0 && newHistory.length > 0) {
      stopNoise(); // Stop continuous noise before showing modal

      // Get last block of results
      const lastBlock = newHistory.slice(-BLOCK_SIZE);
      const accuracyPercent = (lastBlock.filter(Boolean).length / BLOCK_SIZE) * 100;

      // Step Down Detection: User struggling at easiest setting
      // If at max SNR (+20 dB, easiest noise) OR quiet mode, and accuracy ≤50%
      const isAtMaxSNR = currentSNR >= 20;
      const isStrugglingHard = accuracyPercent <= 50;

      if (isStrugglingHard && (isAtMaxSNR || !noiseEnabled)) {
        // Suggest stepping down to Gross Discrimination
        setCoachResponse({
          recommendation: "Word pairs are quite challenging. Let's build your foundation with simpler exercises first - you'll come back stronger!",
          action: "Step Down",
          accuracy: accuracyPercent,
          next_snr: currentSNR, // Keep same SNR
        });
        setShowCoachFeedback(true);
        return; // Don't process further
      }

      // Per 00_MASTER_RULES.md Section 6: Smart Coach only adjusts SNR if noise is enabled
      if (noiseEnabled) {
        // Smart Coach SNR adjustment (pure function, no async)
        const response = evaluateSession(currentSNR, lastBlock);

        // Map API action to UI action format
        const uiAction: CoachUIAction = response.action === 'decrease' ? 'Decrease'
          : response.action === 'increase' ? 'Increase'
          : 'Keep';

        setCoachResponse({
          recommendation: response.recommendation,
          action: uiAction,
          accuracy: response.accuracy,
          next_snr: response.next_snr,
        });
        setShowCoachFeedback(true);

        // Update SNR
        setCurrentSNR(response.next_snr);
        setSNR(response.next_snr);

        // Save to user profile
        if (user?.id) {
          await saveUserSNR(user.id, response.next_snr);
        }
      } else {
        // Quiet Mode: Show feedback without SNR adjustment
        setCoachResponse({
          recommendation: accuracyPercent >= 90
            ? "Perfect score in quiet mode! Ready to try this with background noise?"
            : `${accuracyPercent}% accuracy. Keep practicing!`,
          action: accuracyPercent >= 90 ? "Enable Noise" as const : "Keep" as const,
          accuracy: accuracyPercent,
          next_snr: currentSNR, // No change
        });
        setShowCoachFeedback(true);
      }
    }
  };

  if (!hasStarted) {
    return (
      <ActivityBriefing
        title="Word Pairs"
        description="Can you tell similar-sounding words apart?"
        instructions="Listen to a word, then pick which one you heard from two options. The words will sound similar — listen carefully!"
        sessionInfo="15 rounds · About 3 minutes"
        onStart={() => setHasStarted(true)}
      />
    );
  }

  if (isComplete) {
    const correctCount = trialHistory.filter(Boolean).length;
    const finalAccuracy = trialHistory.length > 0 ? Math.round((correctCount / trialHistory.length) * 100) : 0;
    return (
      <SessionSummary
        sessionTitle="Word Pairs"
        accuracy={finalAccuracy}
        totalItems={trialHistory.length}
        correctCount={correctCount}
        onContinue={() => {
          if (isInPlan) advancePlan();
          else navigate('/practice');
        }}
        nextActivity={planNext ?? {
          label: 'Word Categories',
          description: 'Practice with specific sound contrasts',
          path: '/categories',
        }}
      />
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading word pairs..." />;
  }

  if (sessionRounds.length === 0 || !currentRound) {
    return <div className="p-10 text-center text-slate-500">No content available or session not ready.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header - Dims during playback (Focus Mode) */}
      <motion.header
        animate={{ opacity: isTargetPlaying ? 0.2 : 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50"
      >
        <ActivityHeader title="Word Pairs" backPath="/practice" />

        {/* Noise Toggle (Silent Sentinel Pattern) */}
        <HapticButton
          onClick={handleNoiseToggle}
          aria-label="Toggle background noise"
          aria-pressed={noiseEnabled}
          className={`p-3 rounded-full transition-all duration-200 ${
            noiseEnabled
              ? 'bg-teal-500/20 text-teal-400 ring-2 ring-teal-500/30'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}
          title={noiseEnabled ? 'Background Noise ON' : 'Quiet Mode'}
        >
          {noiseEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </HapticButton>
      </motion.header>

      <main className="max-w-lg mx-auto w-full px-6 py-4 flex-1 flex flex-col">
        {/* Unified Action Button with Aura */}
        <div className="flex justify-center mb-4 relative">
          {/* The Pulsing Aura (behind button) */}
          <AuraVisualizer isPlaying={isTargetPlaying} currentSnr={currentSNR} />

          {/* Action Button */}
          <HapticButton
            onClick={handleAction}
            disabled={isTargetPlaying} // Disable play button when audio is playing
            className={`w-28 h-28 rounded-full shadow-xl flex items-center justify-center text-white z-10 ${
              hasGuessed
                ? 'bg-teal-500 hover:bg-teal-400 hover:scale-105'
                : 'bg-teal-500 hover:bg-teal-400 hover:scale-105'
            }`}
          >
            {hasGuessed ? <ArrowRight size={48} /> : <Play size={48} fill="currentColor" className="ml-1" />}
          </HapticButton>
        </div>

        <motion.h2
          aria-live="polite"
          animate={{ opacity: isTargetPlaying ? 0.2 : 1 }}
          transition={{ duration: 0.3 }}
          className="text-center text-slate-900 dark:text-white font-bold text-xl mb-6"
        >
          {hasGuessed ? (isCorrect ? "Correct!" : "Nice try!") : "Which word did you hear?"}
        </motion.h2>

        {audioError && <p className="text-center text-red-500 mb-4 text-sm">{audioError}</p>}

        {/* Answer Cards */}
        <div className="space-y-3 mb-4">
          {currentRound.options.map((option) => {
            const isSelected = selectedGuess === option;
            const isTheCorrectAnswer = option === currentRound.targetWord;
            const showAnswerText = !hardMode || audioPlayedForRound;

            let cardStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-teal-400 dark:hover:border-teal-600";

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
              <HapticButton
                key={option}
                onClick={() => handleGuess(option)}
                disabled={hasGuessed || !audioPlayedForRound}
                className={`w-full p-6 text-left font-bold text-xl rounded-2xl border-2 shadow-sm flex justify-between items-center ${cardStyle}`}
              >
                <span className={showAnswerText ? '' : 'blur-md select-none'}>
                  {showAnswerText ? option : '???'}
                </span>
                {hasGuessed && isTheCorrectAnswer && <CheckCircle size={24} className="text-green-600" />}
                {hasGuessed && isSelected && !isTheCorrectAnswer && <XCircle size={24} className="text-red-500" />}
              </HapticButton>
            );
          })}
        </div>
        
        {/* Progress Bar */}
        <motion.div
          animate={{ opacity: isTargetPlaying ? 0.2 : 1 }}
          transition={{ duration: 0.3 }}
          className="mt-auto pt-8"
        >
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Round {currentIndex + 1} of {sessionRounds.length}</span>
            <span>{trialHistory.filter(Boolean).length} correct</span>
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-teal-500 rounded-full"
              animate={{ width: `${((currentIndex + 1) / sessionRounds.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      </main>

      {/* Smart Coach Feedback Modal */}
      {showCoachFeedback && coachResponse && (
        <SmartCoachFeedback
          message={coachResponse.recommendation}
          action={coachResponse.action}
          accuracy={coachResponse.accuracy}
          currentSNR={currentSNR}
          nextSNR={coachResponse.next_snr}
          onContinue={() => {
            setShowCoachFeedback(false);
            startNoise(); // Restart continuous noise after modal
          }}
          onEnableNoise={() => {
            // Enable noise when user opts in after achieving mastery
            setNoiseEnabled(true);
            setMixerNoiseEnabled(true);
          }}
          stepDownPath="/practice/gross-discrimination"
        />
      )}
    </div>
  );
}
