import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Play, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSentenceData, getAudioUrl } from '@/hooks/useSentenceData';
import { useUser } from '@/store/UserContext';
import { useProgress } from '@/hooks/useProgress';
import { FeedbackOverlay } from '@/components/ui/FeedbackOverlay';
import { SessionSummary } from '@/components/SessionSummary';
import { ActivityBriefing } from '@/components/ActivityBriefing';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useSilentSentinel } from '@/hooks/useSilentSentinel';
import { getVoiceGender } from '@/lib/voiceGender';
import { useTodaysPlan } from '@/hooks/useTodaysPlan';

const SESSION_LENGTH = 10;

export function SentenceTraining() {
  const navigate = useNavigate();
  const { voice } = useUser();
  const { nextActivity: planNext, advancePlan, isInPlan } = useTodaysPlan();
  const currentVoice = voice || 'sarah';
  const { sentences, loading, error } = useSentenceData({ limit: SESSION_LENGTH, voiceId: currentVoice });
  const { logProgress } = useProgress();
  const { ensureResumed, playUrl } = useSilentSentinel();

  // Briefing state
  const [hasStarted, setHasStarted] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [replayCount, setReplayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Track responses for completion screen
  const [responses, setResponses] = useState<Array<{ correct: boolean }>>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const currentSentence = sentences[currentIndex];

  // Shuffle answers into 4 options
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    if (currentSentence) {
      const { correct_answer, distractor_1, distractor_2, distractor_3 } = currentSentence.clinical_metadata;

      // Use the distractors from database (acoustic foil, semantic foil, generated distractor)
      const allAnswers = [correct_answer, distractor_1, distractor_2, distractor_3]
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

      // Fisher-Yates shuffle
      const shuffled = [...allAnswers];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setAnswers(shuffled);
    }
  }, [currentSentence, currentIndex, sentences]);

  // Handle audio playback — routes through Web Audio API for BT hearing aids
  const handlePlay = async () => {
    if (!currentSentence) return;

    await ensureResumed();
    if (showQuestion) setReplayCount(prev => prev + 1);
    setIsPlaying(true);
    setShowQuestion(false);
    setSelectedAnswer(null);
    setFeedback(null);
    setStartTime(Date.now());

    // Build URL inline and play through sentinel's AudioContext
    const storagePath = currentSentence.audio_assets[0]?.storage_path;
    if (storagePath) {
      const url = getAudioUrl(storagePath);
      try {
        setAudioError(false);
        await playUrl(url);
      } catch {
        setAudioError(true);
      }
    }

    setIsPlaying(false);
    setShowQuestion(true);
  };

  // Handle answer selection
  const handleAnswer = (answer: string) => {
    if (!currentSentence || !startTime) return;

    const isCorrect = answer === currentSentence.clinical_metadata.correct_answer;
    setSelectedAnswer(answer);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    // Track this response
    const newResponses = [...responses, { correct: isCorrect }];
    setResponses(newResponses);

    // Log progress to Smart Coach
    logProgress({
      contentType: 'sentence',
      contentId: currentSentence.id,
      result: isCorrect ? 'correct' : 'incorrect',
      userResponse: answer,
      correctResponse: currentSentence.clinical_metadata.correct_answer,
      responseTimeMs: Date.now() - startTime,
      metadata: {
        activityType: 'sentence_training',
        voiceId: currentVoice,
        voiceGender: getVoiceGender(currentVoice),
        questionText: currentSentence.clinical_metadata.question_text,
        sentenceText: currentSentence.content_text,
        distractors: [
          currentSentence.clinical_metadata.distractor_1,
          currentSentence.clinical_metadata.distractor_2,
          currentSentence.clinical_metadata.distractor_3,
        ].filter(Boolean) as string[],
        difficulty: currentSentence.clinical_metadata.difficulty,
        trialNumber: currentIndex,
        replayCount,
        scenario: currentSentence.clinical_metadata.scenario,
      },
    });

    // Auto-advance after 1.5s
    setTimeout(() => {
      if (currentIndex < sentences.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setReplayCount(0);
        setSelectedAnswer(null);
        setFeedback(null);
        setShowQuestion(false);
      } else {
        // Show completion screen
        setIsComplete(true);
      }
    }, 1500);
  };

  // ActivityBriefing before exercise starts
  if (!hasStarted) {
    return (
      <ActivityBriefing
        title="Sentences"
        description="Listen to sentences and answer comprehension questions."
        instructions="You'll hear a sentence, then choose the correct answer from four options. Listen carefully — the sentences get more challenging as you go."
        sessionInfo="10 sentences · About 3 minutes"
        onStart={() => { ensureResumed(); setHasStarted(true); }}
      />
    );
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading sentences..." />;
  }

  // Error state
  if (error || !sentences.length) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-red-500 dark:text-red-400">Failed to load sentences</p>
      </div>
    );
  }

  // Show completion screen
  if (isComplete) {
    const correctCount = responses.filter(r => r.correct).length;
    const accuracy = (correctCount / responses.length) * 100;

    return (
      <SessionSummary
        sessionTitle="Sentence Training"
        accuracy={accuracy}
        totalItems={responses.length}
        correctCount={correctCount}
        onContinue={() => {
          if (isInPlan) advancePlan();
          else navigate('/');
        }}
        nextActivity={planNext ?? {
          label: 'Everyday Scenarios',
          description: 'Practice with real-world dialogue',
          path: '/scenarios',
        }}
      />
    );
  }

  const totalRounds = sentences.length;

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <FeedbackOverlay type={feedback} />

      {/* Header */}
      <motion.header
        animate={{ opacity: isPlaying ? 0.2 : 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50"
      >
        <button
          onClick={() => navigate('/practice')}
          className="flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} className="mr-1" /> Back
        </button>
        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Sentences
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {responses.length > 0 && `${Math.round((responses.filter(r => r.correct).length / responses.length) * 100)}%`}
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto w-full px-6 py-8 flex-1 flex flex-col">
        {/* Aura Visualizer */}
        <div className="relative flex items-center justify-center h-64">
          <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isPlaying ? 'scale-110' : 'scale-100'
          }`}>
            <div className={`relative w-32 h-32 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-2xl flex items-center justify-center ${
              isPlaying ? 'animate-pulse' : ''
            }`}>
              <Volume2 className="h-12 w-12 text-white" />
            </div>

            {/* Pulsing rings */}
            {isPlaying && (
              <>
                <div className="absolute w-40 h-40 rounded-full border-4 border-teal-300 dark:border-teal-700 animate-ping opacity-30" />
                <div className="absolute w-48 h-48 rounded-full border-4 border-teal-200 dark:border-teal-800 animate-ping opacity-20" style={{ animationDelay: '0.2s' }} />
              </>
            )}
          </div>

          {audioError && (
            <p className="text-center text-sm text-red-500 dark:text-red-400 mb-2">Audio failed to load. Tap to retry.</p>
          )}

          {/* Play Button */}
          {!isPlaying && !showQuestion && (
            <button
              onClick={handlePlay}
              className="absolute z-10 w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Play className="h-8 w-8 ml-1" />
            </button>
          )}
        </div>

        {/* Question Text */}
        {showQuestion && currentSentence && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {currentSentence.clinical_metadata.question_text}
            </p>

            {/* Answer Grid (2x2) */}
            <div className="grid grid-cols-2 gap-3">
              {answers.map((answer, idx) => {
                const isSelected = selectedAnswer === answer;
                const isCorrect = answer === currentSentence.clinical_metadata.correct_answer;
                const showResult = selectedAnswer !== null;

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(answer)}
                    disabled={selectedAnswer !== null}
                    className={`
                      py-6 px-4 rounded-xl font-bold text-center transition-all text-lg flex items-center justify-center gap-2
                      ${!showResult && 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 active:scale-95 border-2 border-teal-200 dark:border-teal-800'}
                      ${showResult && isSelected && isCorrect && 'bg-teal-500 text-white scale-105 border-2 border-teal-600'}
                      ${showResult && isSelected && !isCorrect && 'bg-slate-700 text-white scale-95 border-2 border-slate-800'}
                      ${showResult && !isSelected && isCorrect && 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 border-2 border-teal-400 dark:border-teal-600 ring-2 ring-teal-400 dark:ring-teal-600 ring-offset-2 dark:ring-offset-slate-900'}
                      ${showResult && !isSelected && !isCorrect && 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-50 border-2 border-slate-300 dark:border-slate-700'}
                      ${selectedAnswer !== null && 'cursor-not-allowed'}
                    `}
                  >
                    {showResult && isCorrect && <CheckCircle className="h-6 w-6" />}
                    {showResult && isSelected && !isCorrect && <XCircle className="h-6 w-6" />}
                    <span>{answer}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress indicator */}
        <div className="mt-auto pt-8">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Round {currentIndex + 1} of {totalRounds}</span>
            <span>Erber Level: Comprehension</span>
          </div>
          <div className="h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / totalRounds) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
