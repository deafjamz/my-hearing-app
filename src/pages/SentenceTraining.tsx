import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Volume2, Play, CheckCircle, XCircle } from 'lucide-react';
import { useSentenceData, getAudioUrl } from '@/hooks/useSentenceData';
import { useVoice } from '@/store/VoiceContext';
import { useProgress } from '@/hooks/useProgress';
import { FeedbackOverlay } from '@/components/ui/FeedbackOverlay';
import { SessionSummary } from '@/components/SessionSummary';

export function SentenceTraining() {
  const navigate = useNavigate();
  const { currentVoice } = useVoice();
  const { sentences, loading, error } = useSentenceData({ limit: 10, voiceId: currentVoice as 'sarah' | 'marcus' });
  const { logProgress } = useProgress();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuestion, setShowQuestion] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Track responses for completion screen
  const [responses, setResponses] = useState<Array<{ correct: boolean }>>([]);
  const [isComplete, setIsComplete] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
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

      // Shuffle all answers
      setAnswers(allAnswers.sort(() => Math.random() - 0.5));
    }
  }, [currentSentence, currentIndex, sentences]);

  // Handle audio playback
  const handlePlay = () => {
    if (!audioRef.current || !currentSentence) return;

    audioRef.current.play();
    setIsPlaying(true);
    setShowQuestion(false);
    setSelectedAnswer(null);
    setFeedback(null);
    setStartTime(Date.now());
  };

  const handleAudioEnded = () => {
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
        voiceId: currentVoice,
        question: currentSentence.clinical_metadata.question_text,
        difficulty: currentSentence.clinical_metadata.difficulty,
        scenario: currentSentence.clinical_metadata.scenario,
      },
    });

    // Auto-advance after 1.5s
    setTimeout(() => {
      if (currentIndex < sentences.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setFeedback(null);
        setShowQuestion(false);
      } else {
        // Show completion screen
        setIsComplete(true);
      }
    }, 1500);
  };

  // Render loading/error states
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-gray-500">Loading sentences...</p>
    </div>
  );

  if (error || !sentences.length) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-red-500">Failed to load sentences</p>
    </div>
  );

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
        onContinue={() => navigate('/practice')}
      />
    );
  }

  const audioUrl = currentSentence?.audio_assets[0]?.storage_path
    ? getAudioUrl(currentSentence.audio_assets[0].storage_path)
    : '';

  return (
    <div className="relative min-h-screen bg-slate-50">
      <FeedbackOverlay type={feedback} />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>
        <div className="text-sm text-gray-500">
          {currentIndex + 1} / {sentences.length}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-6 space-y-8">
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
                <div className="absolute w-40 h-40 rounded-full border-4 border-violet-300 animate-ping opacity-30" />
                <div className="absolute w-48 h-48 rounded-full border-4 border-violet-200 animate-ping opacity-20" style={{ animationDelay: '0.2s' }} />
              </>
            )}
          </div>

          {/* Play Button */}
          {!isPlaying && !showQuestion && (
            <button
              onClick={handlePlay}
              className="absolute z-10 w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center text-violet-600 hover:bg-violet-50 transition-colors"
            >
              <Play className="h-8 w-8 ml-1" />
            </button>
          )}
        </div>

        {/* Question Text */}
        {showQuestion && currentSentence && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-4">
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
                      ${!showResult && 'bg-violet-50 text-violet-700 hover:bg-violet-100 active:scale-95 border-2 border-violet-200'}
                      ${showResult && isSelected && isCorrect && 'bg-teal-500 text-white scale-105 border-2 border-teal-600'}
                      ${showResult && isSelected && !isCorrect && 'bg-slate-700 text-white scale-95 border-2 border-slate-800'}
                      ${showResult && !isSelected && isCorrect && 'bg-teal-100 text-teal-700 border-2 border-teal-400 ring-2 ring-teal-400 ring-offset-2'}
                      ${showResult && !isSelected && !isCorrect && 'bg-slate-100 text-slate-400 opacity-50 border-2 border-slate-300'}
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

        {/* Hidden audio element */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={handleAudioEnded}
            preload="auto"
          />
        )}
      </div>
    </div>
  );
}
