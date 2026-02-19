import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ActivityBriefing } from '@/components/ActivityBriefing';
import { SessionSummary } from '@/components/SessionSummary';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/primitives';
import { useConversationData, type ConversationPair } from '@/hooks/useConversationData';
import { useSilentSentinel } from '@/hooks/useSilentSentinel';
import { useProgress } from '@/hooks/useProgress';
import { useUser } from '@/store/UserContext';
import { useVoice } from '@/store/VoiceContext';
import { useTodaysPlan } from '@/hooks/useTodaysPlan';
import { getVoiceGender } from '@/lib/voiceGender';
import { hapticSelection, hapticSuccess, hapticFailure } from '@/lib/haptics';

/**
 * Conversation Player - Trial-by-trial keyword identification in conversations
 * Plays a prompt, user identifies the target keyword from 4 choices
 */

export function ConversationPlayer() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { voice } = useUser();
  const { selectedVoice: voiceObj } = useVoice();
  const { ensureResumed, playUrl, stopPlayback } = useSilentSentinel();
  const { logProgress } = useProgress();
  const { nextActivity: planNext, advancePlan, isInPlan } = useTodaysPlan();
  const { conversations, loading, fetchByCategory, getAudioUrl } = useConversationData();

  const selectedVoice = voice || 'sarah';

  // State machine
  const [hasStarted, setHasStarted] = useState(false);
  const [sessionItems, setSessionItems] = useState<ConversationPair[]>([]);
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
    const saved = localStorage.getItem('conversationAutoplay');
    return saved ? saved === 'true' : false;
  });

  // Fetch conversations when category changes
  useEffect(() => {
    if (category) {
      fetchByCategory(decodeURIComponent(category));
    }
  }, [category, fetchByCategory]);

  // Set up session when conversations are loaded
  useEffect(() => {
    if (conversations.length > 0 && sessionItems.length === 0) {
      const shuffled = [...conversations].sort(() => Math.random() - 0.5);
      setSessionItems(shuffled.slice(0, 10));
      setTrialStartTime(Date.now());
    }
  }, [conversations, sessionItems.length]);

  // Build shuffled choices - must be before conditional returns (rules of hooks)
  const currentItem = sessionItems[currentIndex];
  const shuffledChoices = useMemo(() => {
    if (!currentItem) return [];
    const choices = [
      currentItem.targetKeyword,
      currentItem.acousticFoil,
      currentItem.semanticFoil,
      currentItem.plausibleFoil,
    ].filter(Boolean);
    return choices.sort(() => Math.random() - 0.5);
  }, [currentIndex, sessionItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autoplay on new trial
  useEffect(() => {
    if (autoplayEnabled && hasStarted && currentItem && !hasPlayed && !feedback) {
      if (currentItem.promptAudioUrl) {
        playAudio(currentItem.promptAudioUrl);
        setHasPlayed(true);
      }
    }
  }, [currentIndex, autoplayEnabled, hasStarted, sessionItems, hasPlayed, feedback]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!currentItem) return;

    hapticSelection();
    if (currentItem.promptAudioUrl) {
      if (hasPlayed) setReplayCount(prev => prev + 1);
      playAudio(currentItem.promptAudioUrl);
      setHasPlayed(true);
    }
  };

  const toggleAutoplay = () => {
    hapticSelection();
    const newValue = !autoplayEnabled;
    setAutoplayEnabled(newValue);
    localStorage.setItem('conversationAutoplay', newValue.toString());
  };

  const handleAnswer = (selectedWord: string) => {
    if (feedback) return;

    const responseTime = Date.now() - trialStartTime;
    const correctWord = currentItem.targetKeyword;
    const isCorrect = selectedWord === correctWord;

    if (isCorrect) hapticSuccess(); else hapticFailure();

    setResponses(prev => [...prev, { correct: isCorrect, responseTime }]);
    setFeedback({ isCorrect, correctWord, selectedWord });

    logProgress({
      contentType: 'sentence',
      contentId: currentItem.id,
      result: isCorrect ? 'correct' : 'incorrect',
      userResponse: selectedWord,
      correctResponse: correctWord,
      responseTimeMs: responseTime,
      metadata: {
        activityType: 'conversation',
        voiceId: selectedVoice,
        voiceGender: getVoiceGender(selectedVoice),
        category: currentItem.category,
        trialNumber: currentIndex,
        replayCount,
      },
    });

    const isLast = currentIndex >= sessionItems.length - 1;

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

  // --- RENDER STATES ---

  if (!hasStarted) {
    const displayCategory = category ? decodeURIComponent(category) : 'Conversation';
    return (
      <ActivityBriefing
        title={displayCategory.charAt(0).toUpperCase() + displayCategory.slice(1)}
        description="Listen to a conversation prompt and identify the target keyword."
        instructions="You'll hear one side of a conversation. Pick the keyword you heard from 4 choices. You'll get instant feedback."
        sessionInfo="10 items · About 3 minutes"
        onStart={() => setHasStarted(true)}
      />
    );
  }

  if (loading || sessionItems.length === 0) {
    return <LoadingSpinner message="Loading conversations..." />;
  }

  if (isComplete) {
    const accuracy = responses.length > 0
      ? (responses.filter(r => r.correct).length / responses.length) * 100
      : 0;

    return (
      <SessionSummary
        sessionTitle={category ? decodeURIComponent(category) : 'Conversation'}
        accuracy={accuracy}
        totalItems={sessionItems.length}
        correctCount={responses.filter(r => r.correct).length}
        onContinue={() => {
          if (isInPlan) advancePlan();
          else navigate('/practice/conversations');
        }}
        nextActivity={planNext ?? {
          label: 'More Conversations',
          description: 'Try another conversation category',
          path: '/practice/conversations',
        }}
      />
    );
  }

  const progressPercent = ((currentIndex + 1) / sessionItems.length) * 100;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/practice/conversations"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Conversations</span>
          </Link>

          <h1 className="text-2xl font-bold text-white mb-1 capitalize">
            {category ? decodeURIComponent(category) : 'Conversation'}
          </h1>
          <p className="text-pink-400 text-sm">
            Identify the keyword
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Progress</span>
            <span>{currentIndex + 1} / {sessionItems.length}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Trial Area */}
        <div className="space-y-6">
          {/* Prompt text context */}
          <Card variant="subtle" padding="p-4" className="rounded-xl">
            <p className="text-slate-300 text-sm italic leading-relaxed">
              &ldquo;{currentItem.promptText}&rdquo;
            </p>
          </Card>

          {/* Autoplay Toggle */}
          <Card variant="subtle" padding="p-4" className="flex items-center justify-between rounded-xl">
            <div className="flex items-center gap-3">
              <Play size={20} className="text-pink-400" />
              <div>
                <p className="text-white font-medium text-sm">Autoplay Audio</p>
                <p className="text-slate-500 text-xs">Play automatically on each item</p>
              </div>
            </div>
            <button
              onClick={toggleAutoplay}
              className={`relative w-14 h-8 rounded-full transition-all ${
                autoplayEnabled ? 'bg-pink-500' : 'bg-slate-700'
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
              className="w-28 h-28 rounded-full bg-pink-500 hover:bg-pink-400 hover:scale-105 shadow-xl flex items-center justify-center text-white transition-all"
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
                  The keyword was &ldquo;{feedback.correctWord}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Answer Buttons — 4 choices */}
          <div className="grid grid-cols-2 gap-4">
            {shuffledChoices.map((word) => {
              let btnStyle = 'border-slate-700 hover:border-pink-500';
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
                  className={`p-6 bg-slate-900 border-2 rounded-2xl transition-all ${btnStyle}`}
                >
                  <p className="text-white font-bold text-lg">{word}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
