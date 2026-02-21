import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { SNRMixer } from '@/components/ui/SNRMixer';
import { QuizCard } from '@/components/ui/QuizCard';
import { useActivityData } from '@/hooks/useActivityData';
import { useUser } from '@/store/UserContext';
import { getAudioPath } from '@/lib/audioUtils';
import { ActivityHeader } from '@/components/ui/ActivityHeader';
import { FeedbackOverlay } from '@/components/ui/FeedbackOverlay';
import { KaraokeTranscript } from '@/components/ui/KaraokeTranscript';
import { useProgress } from '@/hooks/useProgress';
import { getVoiceGender } from '@/lib/voiceGender';

export function Player() {
  const { id } = useParams<{ id: string }>();
  const { voice, hardMode } = useUser();
  const { data: activityData, loading, error } = useActivityData(id);
  const { logProgress } = useProgress();

  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioHasPlayed, setAudioHasPlayed] = useState(false);

  // Track time per question (resets on each answer)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Clear feedback timer
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    if (time > 0) setAudioHasPlayed(true);
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading activity...</div>;
  }

  if (error || !activityData) {
    return <div className="p-8 text-center text-red-500">Activity not found or failed to load.</div>;
  }

  // Dynamic path resolution
  const dynamicAudioSrc = getAudioPath(activityData, voice || 'sarah');
  const isScenario = !!activityData.noiseSrc;

  const handleAnswer = (isCorrect: boolean, questionId: string, userAnswer: string, correctAnswer: string) => {
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    logProgress({
        contentType: isScenario ? 'scenario' : 'story',
        contentId: activityData.id,
        result: isCorrect ? 'correct' : 'incorrect',
        userResponse: userAnswer,
        correctResponse: correctAnswer,
        responseTimeMs: Date.now() - questionStartTime,
        metadata: {
            activityType: isScenario ? 'scenario' : 'story',
            voiceId: voice || 'sarah',
            voiceGender: getVoiceGender(voice || 'sarah'),
            storyId: activityData.id,
            questionText: questionId,
            noiseEnabled: isScenario,
        }
    });

    // Reset timer for next question
    setQuestionStartTime(Date.now());
  };

  return (
    <div className="relative min-h-screen bg-slate-50 pb-24">
      <FeedbackOverlay type={feedback} />

      <div className="p-6 max-w-md mx-auto space-y-8 relative z-10">
        <ActivityHeader streak={0} />

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center space-y-4">
          <h1 className="text-xl font-bold text-slate-900">{activityData.title}</h1>
          
          {isScenario ? (
            <SNRMixer voiceSrc={dynamicAudioSrc} noiseSrc={activityData.noiseSrc!} />
          ) : (
            <AudioPlayer src={dynamicAudioSrc} onTimeUpdate={handleTimeUpdate} />
          )}
          
          <div className="p-4 bg-gray-50 rounded-lg text-left text-sm text-gray-600">
            <p className="font-semibold mb-1">Transcript:</p>
            {hardMode && !audioHasPlayed ? (
              <p className="text-slate-400 italic">Listen to the audio first...</p>
            ) : activityData.transcript && 'alignmentData' in activityData && activityData.alignmentData ? (
              <KaraokeTranscript
                transcript={activityData.transcript}
                alignmentData={activityData.alignmentData}
                currentTime={currentTime}
                voiceId={voice || 'sarah'}
              />
            ) : (
              <p>{activityData.transcript}</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {activityData.questions.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-teal-500 rounded-full" />
                <h2 className="text-xl font-bold text-slate-200">Comprehension Check</h2>
              </div>
              
              {activityData.questions.map(q => (
                <QuizCard
                  key={q.id}
                  question={q}
                  onAnswer={(isCorrect, choiceText, correctText) => handleAnswer(isCorrect, q.id, choiceText, correctText)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}