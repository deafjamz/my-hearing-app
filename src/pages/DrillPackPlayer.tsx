import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActivityBriefing } from '@/components/ActivityBriefing';
import { SessionSummary } from '@/components/SessionSummary';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/primitives';
import { useDrillPackData, type DrillPair } from '@/hooks/useDrillPackData';
import { useSilentSentinel } from '@/hooks/useSilentSentinel';
import { useProgress } from '@/hooks/useProgress';
import { useUser } from '@/store/UserContext';
import { useVoice } from '@/store/VoiceContext';
import { useTodaysPlan } from '@/hooks/useTodaysPlan';
import { getVoiceGender } from '@/lib/voiceGender';
import { hapticSelection, hapticSuccess, hapticFailure } from '@/lib/haptics';

/**
 * Drill Pack Player - Trial-by-trial phoneme contrast practice
 * Plays one word from a pair, user identifies which word they heard
 */

export function DrillPackPlayer() {
  const { packId } = useParams<{ packId: string }>();
  const navigate = useNavigate();
  const { voice } = useUser();
  const { selectedVoice: voiceObj } = useVoice();
  const { ensureResumed, playUrl, stopPlayback } = useSilentSentinel();
  const { logProgress } = useProgress();
  const { nextActivity: planNext, advancePlan, isInPlan } = useTodaysPlan();
  const { drillPairs, packs, loading, fetchByPack, getAudioUrl } = useDrillPackData();

  const selectedVoice = voice || 'sarah';

  // State machine
  const [hasStarted, setHasStarted] = useState(false);
  const [sessionPairs, setSessionPairs] = useState<Array<DrillPair & { playWord: 'word1' | 'word2' }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Trial tracking
  const [responses, setResponses] = useState<Array<{ correct: boolean; responseTime: number }>>([]);
  const [trialStartTime, setTrialStartTime] = useState<number>(Date.now());
  const [replayCount, setReplayCount] = useState(0);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctWord: string; selectedWord: string } | null>(null);
  const [audioError, setAudioError] = useState(false);

  // Autoplay
  const [autoplayEnabled, setAutoplayEnabled] = useState(() => {
    const saved = localStorage.getItem('drillAutoplay');
    return saved ? saved === 'true' : false;
  });

  // Pack info
  const currentPack = packs.find(p => p.drill_pack_id === packId);

  // Fetch pairs when packId changes
  useEffect(() => {
    if (packId) {
      fetchByPack(packId);
    }
  }, [packId, fetchByPack]);

  // Set up session when pairs are loaded
  useEffect(() => {
    if (drillPairs.length > 0 && sessionPairs.length === 0) {
      const shuffled = [...drillPairs].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 10).map(pair => ({
        ...pair,
        playWord: (Math.random() > 0.5 ? 'word1' : 'word2') as 'word1' | 'word2',
      }));
      setSessionPairs(selected);
      setTrialStartTime(Date.now());
    }
  }, [drillPairs, sessionPairs.length]);

  // Autoplay on new trial
  useEffect(() => {
    if (autoplayEnabled && hasStarted && sessionPairs[currentIndex] && !hasPlayed && !feedback) {
      const pair = sessionPairs[currentIndex];
      const audioUrl = pair.playWord === 'word1' ? pair.word1AudioUrl : pair.word2AudioUrl;
      if (audioUrl) {
        playAudio(audioUrl);
        setHasPlayed(true);
      }
    }
  }, [currentIndex, autoplayEnabled, hasStarted, sessionPairs, hasPlayed, feedback]);

  const playAudio = async (url: string) => {
    try {
      setAudioError(false);
      await ensureResumed();
      stopPlayback();
      await playUrl(url);
    } catch {
      setAudioError(true);
    }
  };

  const handlePlay = () => {
    const pair = sessionPairs[currentIndex];
    if (!pair) return;

    hapticSelection();
    const audioUrl = pair.playWord === 'word1' ? pair.word1AudioUrl : pair.word2AudioUrl;
    if (audioUrl) {
      if (hasPlayed) setReplayCount(prev => prev + 1);
      playAudio(audioUrl);
      setHasPlayed(true);
    }
  };

  const toggleAutoplay = () => {
    hapticSelection();
    const newValue = !autoplayEnabled;
    setAutoplayEnabled(newValue);
    localStorage.setItem('drillAutoplay', newValue.toString());
  };

  const handleAnswer = (selectedWord: string) => {
    if (feedback) return;

    const pair = sessionPairs[currentIndex];
    const responseTime = Date.now() - trialStartTime;
    const correctWord = pair.playWord === 'word1' ? pair.word1 : pair.word2;
    const isCorrect = selectedWord === correctWord;

    if (isCorrect) hapticSuccess(); else hapticFailure();

    setResponses(prev => [...prev, { correct: isCorrect, responseTime }]);
    setFeedback({ isCorrect, correctWord, selectedWord });

    logProgress({
      contentType: 'word',
      contentId: pair.id,
      result: isCorrect ? 'correct' : 'incorrect',
      userResponse: selectedWord,
      correctResponse: correctWord,
      responseTimeMs: responseTime,
      metadata: {
        activityType: 'phoneme_drill',
        voiceId: selectedVoice,
        voiceGender: getVoiceGender(selectedVoice),
        targetPhoneme: pair.targetPhoneme,
        contrastPhoneme: pair.contrastPhoneme,
        packId: pair.packId,
        trialNumber: currentIndex,
        replayCount,
      },
    });

    const isLast = currentIndex >= sessionPairs.length - 1;

    setTimeout(() => {
      setFeedback(null);
      setReplayCount(0);
      setHasPlayed(false);
      if (!isLast) {
        setCurrentIndex(prev => prev + 1);
        setTrialStartTime(Date.now());
      } else {
        setIsComplete(true);
      }
    }, 1500);
  };

  // Hooks must be called before any conditional returns
  const currentPair = sessionPairs[currentIndex];
  const shuffledOptions = useMemo(
    () => currentPair
      ? (Math.random() > 0.5 ? [currentPair.word1, currentPair.word2] : [currentPair.word2, currentPair.word1])
      : [],
    [currentIndex, sessionPairs.length] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const progressPercent = sessionPairs.length > 0
    ? ((currentIndex + 1) / sessionPairs.length) * 100
    : 0;

  // --- RENDER STATES ---

  if (!hasStarted) {
    const packName = currentPack?.pack_name || packId || 'Phoneme Drill';
    const phonemeInfo = currentPack
      ? `${currentPack.target_phoneme} vs ${currentPack.contrast_phoneme}`
      : '';

    return (
      <ActivityBriefing
        title={packName}
        description={phonemeInfo ? `Focus: ${phonemeInfo}` : 'Practice hearing the difference between similar sounds.'}
        instructions="You'll hear one word from a pair. Pick which word you heard. You'll get instant feedback after each answer."
        sessionInfo="10 pairs · About 2 minutes"
        onStart={() => setHasStarted(true)}
      />
    );
  }

  if (loading || sessionPairs.length === 0) {
    return <LoadingSpinner message="Loading drill pairs..." />;
  }

  if (isComplete) {
    const accuracy = responses.length > 0
      ? (responses.filter(r => r.correct).length / responses.length) * 100
      : 0;

    return (
      <SessionSummary
        sessionTitle={currentPack?.pack_name || 'Phoneme Drill'}
        accuracy={accuracy}
        totalItems={sessionPairs.length}
        correctCount={responses.filter(r => r.correct).length}
        onContinue={() => {
          if (isInPlan) advancePlan();
          else navigate('/practice/drills');
        }}
        nextActivity={planNext ?? {
          label: 'More Drills',
          description: 'Try another phoneme contrast pack',
          path: '/practice/drills',
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/practice/drills"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Drill Packs</span>
          </Link>

          <h1 className="text-2xl font-bold text-white mb-1">
            {currentPack?.pack_name || 'Phoneme Drill'}
          </h1>
          <p className="text-purple-400 text-sm font-mono">
            {currentPack?.target_phoneme} vs {currentPack?.contrast_phoneme}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Progress</span>
            <span>{currentIndex + 1} / {sessionPairs.length}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Trial Area */}
        <div className="space-y-6">
          {/* Autoplay Toggle */}
          <Card variant="subtle" padding="p-4" className="flex items-center justify-between rounded-xl">
            <div className="flex items-center gap-3">
              <Play size={20} className="text-purple-400" />
              <div>
                <p className="text-white font-medium text-sm">Autoplay Audio</p>
                <p className="text-slate-500 text-xs">Play automatically on each item</p>
              </div>
            </div>
            <button
              onClick={toggleAutoplay}
              className={`relative w-14 h-8 rounded-full transition-all ${
                autoplayEnabled ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  autoplayEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </Card>

          {audioError && (
            <p className="text-center text-sm text-red-400 mb-2">Audio failed to load. Tap to retry.</p>
          )}

          {/* Play Button */}
          <div className="flex justify-center">
            <button
              onClick={handlePlay}
              className="w-28 h-28 rounded-full bg-purple-500 hover:bg-purple-400 hover:scale-105 shadow-xl flex items-center justify-center text-white transition-all"
            >
              <Play size={48} fill="currentColor" className="ml-1" />
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`text-center py-3 rounded-xl ${
              feedback.isCorrect
                ? 'bg-teal-900/30 text-teal-300'
                : 'bg-red-900/30 text-red-300'
            }`}>
              <p className="font-bold text-lg">
                {feedback.isCorrect ? 'Correct!' : 'Not quite'}
              </p>
              {!feedback.isCorrect && (
                <p className="text-sm opacity-80 mt-1">
                  The word was &ldquo;{feedback.correctWord}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Answer Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {shuffledOptions.map((word) => {
              let btnStyle = 'border-slate-700 hover:border-purple-500';
              if (feedback) {
                if (word === feedback.correctWord) {
                  btnStyle = 'border-teal-500 bg-teal-900/20';
                } else if (word === feedback.selectedWord && !feedback.isCorrect) {
                  btnStyle = 'border-red-500 bg-red-900/20';
                } else {
                  btnStyle = 'border-slate-700 opacity-50';
                }
              }
              return (
                <button
                  key={word}
                  onClick={() => handleAnswer(word)}
                  disabled={!!feedback}
                  className={`p-8 bg-slate-900 border-2 rounded-2xl transition-all ${btnStyle}`}
                >
                  <p className="text-white font-bold text-2xl">{word}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
