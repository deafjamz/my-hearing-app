import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { SessionSummary } from '@/components/SessionSummary';
import { ChevronLeft, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/store/UserContext';
import { ActivityBriefing } from '@/components/ActivityBriefing';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useSilentSentinel } from '@/hooks/useSilentSentinel';
import { Card } from '@/components/primitives';
import { useProgress } from '@/hooks/useProgress';
import { getVoiceGender } from '@/lib/voiceGender';
import { useTodaysPlan } from '@/hooks/useTodaysPlan';
import { hapticSelection, hapticSuccess, hapticFailure } from '@/lib/haptics';

/**
 * Category Player - Quick Practice mode for word pairs by category
 * Loads 10 random pairs from a specific contrast category
 */

interface AudioAsset {
  id: string;
  voice_id: string;
  storage_path: string;
}

interface StimulusRow {
  id: string;
  clinical_metadata: Record<string, string> | null;
  audio_assets: AudioAsset[] | null;
}

interface WordPair {
  id: string;
  word1: string;
  word2: string;
  audioPath?: string;
}

export function CategoryPlayer() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { voice } = useUser();
  const { ensureResumed, playUrl, stopPlayback } = useSilentSentinel();
  const { logProgress } = useProgress();
  const { nextActivity: planNext, advancePlan, isInPlan } = useTodaysPlan();

  // Briefing state
  const [hasStarted, setHasStarted] = useState(false);

  // Replay tracking
  const [replayCount, setReplayCount] = useState(0);

  const [pairs, setPairs] = useState<WordPair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const selectedVoice = voice || 'sarah';

  // Performance tracking
  const [responses, setResponses] = useState<Array<{ correct: boolean; responseTime: number }>>([]);
  const [trialStartTime, setTrialStartTime] = useState<number>(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  // Autoplay state
  const [autoplayEnabled, setAutoplayEnabled] = useState(() => {
    const saved = localStorage.getItem('wordPairAutoplay');
    return saved ? saved === 'true' : false;
  });
  const [hasPlayed, setHasPlayed] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctWord: string; selectedWord: string } | null>(null);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    if (category) {
      fetchCategoryPairs();
    }
  }, [category]);

  useEffect(() => {
    // Auto-play only if enabled
    if (autoplayEnabled && pairs[currentIndex]?.audioPath && !hasPlayed) {
      playAudio(pairs[currentIndex].audioPath!);
      setHasPlayed(true);
    }
  }, [currentIndex, autoplayEnabled, pairs]);

  const fetchCategoryPairs = async () => {
    try {
      const decodedCategory = decodeURIComponent(category || '');

      // Fetch word pairs from this category (server-side filter)
      const { data: stimuli, error } = await supabase
        .from('stimuli_catalog')
        .select(`
          id,
          clinical_metadata,
          audio_assets (
            id,
            voice_id,
            storage_path
          )
        `)
        .eq('content_type', 'word_pair')
        .eq('clinical_metadata->>contrast_category', decodedCategory);

      if (error) throw error;

      // Map to WordPair format
      const categoryPairs = (stimuli as StimulusRow[])
        .map((s) => {
          // Try selected voice first, fall back to any available voice
          const audio = s.audio_assets?.find((a) => a.voice_id === selectedVoice)
            || s.audio_assets?.[0];
          return {
            id: s.id,
            word1: s.clinical_metadata?.word_1 || '',
            word2: s.clinical_metadata?.word_2 || '',
            audioPath: audio?.storage_path,
          };
        })
        .filter((p: WordPair) => p.audioPath); // Only pairs with audio

      // Shuffle and take 10 (minimum 5 for a meaningful session)
      const shuffled = categoryPairs.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 10);

      setPairs(selected);
      setTrialStartTime(Date.now());
    } catch (err) {
      console.error('Error fetching category pairs:', err);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (storagePath: string) => {
    try {
      setAudioError(false);
      await ensureResumed();
      stopPlayback(); // Stop any currently playing audio

      const { data } = supabase.storage.from('audio').getPublicUrl(storagePath);
      await playUrl(data.publicUrl);
    } catch {
      setAudioError(true);
    }
  };

  const toggleAutoplay = () => {
    hapticSelection();
    const newValue = !autoplayEnabled;
    setAutoplayEnabled(newValue);
    localStorage.setItem('wordPairAutoplay', newValue.toString());
  };

  const handleAnswer = (selectedWord: string) => {
    if (feedback) return; // Prevent double-tap during feedback

    const responseTime = Date.now() - trialStartTime;
    const currentPair = pairs[currentIndex];

    // Determine correct answer from audio path
    let correctWord = '';
    if (currentPair.audioPath) {
      const filename = currentPair.audioPath.split('/').pop() || '';
      correctWord = filename.replace('.mp3', '').toLowerCase();
    }

    const isCorrect = selectedWord.toLowerCase() === correctWord;
    if (isCorrect) hapticSuccess(); else hapticFailure();
    setResponses(prev => [...prev, { correct: isCorrect, responseTime }]);
    setFeedback({ isCorrect, correctWord, selectedWord: selectedWord.toLowerCase() });

    // Determine the distractor word (the word NOT played)
    const distractorWord = selectedWord.toLowerCase() === currentPair.word1.toLowerCase()
      ? currentPair.word2
      : currentPair.word1;

    // Log per-trial progress
    logProgress({
      contentType: 'word',
      contentId: currentPair.id,
      result: isCorrect ? 'correct' : 'incorrect',
      userResponse: selectedWord,
      correctResponse: correctWord,
      responseTimeMs: responseTime,
      metadata: {
        activityType: 'category_practice',
        voiceId: selectedVoice,
        voiceGender: getVoiceGender(selectedVoice),
        clinicalCategory: decodeURIComponent(category || ''),
        distractorWord,
        trialNumber: currentIndex,
        replayCount,
      },
    });

    const isLast = currentIndex >= pairs.length - 1;

    // Auto-advance after showing feedback
    setTimeout(() => {
      setFeedback(null);
      setReplayCount(0);
      if (!isLast) {
        setCurrentIndex(prev => prev + 1);
        setTrialStartTime(Date.now());
        setHasPlayed(false);
      } else {
        setIsComplete(true);
      }
    }, 1500);
  };

  if (!hasStarted) {
    return (
      <ActivityBriefing
        title={`${decodeURIComponent(category || '')} Practice`}
        description="Practice hearing the difference between similar sounds."
        instructions="Listen to the audio, then pick which word you heard. You'll get instant feedback after each answer."
        sessionInfo="10 pairs · About 2 minutes"
        onStart={() => setHasStarted(true)}
      />
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading pairs..." />;
  }

  if (pairs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 mb-4">No audio available for this category yet.</div>
          <p className="text-slate-500 text-sm mb-4">Audio for this category hasn't been generated. Try a different category.</p>
          <Link to="/categories" className="text-slate-400 hover:text-slate-300">
            ← Back to Categories
          </Link>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const accuracy = (responses.filter(r => r.correct).length / responses.length) * 100;
    return (
      <SessionSummary
        sessionTitle={`${decodeURIComponent(category || '')} Practice`}
        accuracy={accuracy}
        totalItems={pairs.length}
        correctCount={responses.filter(r => r.correct).length}
        onContinue={() => {
          if (isInPlan) advancePlan();
          else navigate('/categories');
        }}
        nextActivity={planNext ?? {
          label: 'RapidFire Challenge',
          description: 'Test your skills with all word pairs',
          path: '/practice/rapid-fire',
        }}
      />
    );
  }

  const currentPair = pairs[currentIndex];
  const shuffledOptions = useMemo(
    () => Math.random() > 0.5 ? [currentPair.word1, currentPair.word2] : [currentPair.word2, currentPair.word1],
    [currentIndex]
  );
  const progressPercent = ((currentIndex + 1) / pairs.length) * 100;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Categories</span>
          </Link>

          <h1 className="text-2xl font-bold text-white mb-2">
            {decodeURIComponent(category || '')} Practice
          </h1>
          <p className="text-slate-400 text-sm">Quick practice mode</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
            <span>Progress</span>
            <span>{currentIndex + 1} / {pairs.length}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Word Pair Player */}
        <div className="space-y-6">
          {/* Autoplay Toggle */}
          <Card variant="subtle" padding="p-4" className="flex items-center justify-between rounded-xl">
            <div className="flex items-center gap-3">
              <Play size={20} className="text-teal-400" />
              <div>
                <p className="text-white font-medium text-sm">Autoplay Audio</p>
                <p className="text-slate-500 text-xs">Play automatically on each item</p>
              </div>
            </div>
            <button
              onClick={toggleAutoplay}
              className={`relative w-14 h-8 rounded-full transition-all ${
                autoplayEnabled ? 'bg-teal-500' : 'bg-slate-700'
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
            <p className="text-center text-sm text-red-500 dark:text-red-400 mb-2">Audio failed to load. Tap to retry.</p>
          )}

          {/* Play Button — teal circle, matches Detection/RapidFire */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                if (currentPair.audioPath) {
                  hapticSelection();
                  if (hasPlayed) setReplayCount(prev => prev + 1);
                  playAudio(currentPair.audioPath);
                  setHasPlayed(true);
                }
              }}
              className="w-28 h-28 rounded-full bg-teal-500 hover:bg-teal-400 hover:scale-105 shadow-xl flex items-center justify-center text-white transition-all"
            >
              <Play size={48} fill="currentColor" className="ml-1" />
            </button>
          </div>

          {/* Per-answer feedback */}
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
                  The word was "{feedback.correctWord}"
                </p>
              )}
            </div>
          )}

          {/* Answer Buttons */}
          <div className="grid grid-cols-2 gap-4">
            {shuffledOptions.map((word) => {
              let btnStyle = 'border-slate-700 hover:border-teal-500';
              if (feedback) {
                if (word.toLowerCase() === feedback.correctWord) {
                  btnStyle = 'border-teal-500 bg-teal-900/20';
                } else if (word.toLowerCase() === feedback.selectedWord && !feedback.isCorrect) {
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
