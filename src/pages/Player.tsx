import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { SNRMixer } from '@/components/ui/SNRMixer';
import { QuizCard } from '@/components/ui/QuizCard';
import { useActivityData } from '@/hooks/useActivityData';
import { useVoice } from '@/store/VoiceContext';
import { useUser } from '@/store/UserContext';
import { getAudioPath } from '@/lib/audioUtils';
import { ActivityHeader } from '@/components/ui/ActivityHeader';
import { FeedbackOverlay } from '@/components/ui/FeedbackOverlay';
import { KaraokeTranscript } from '@/components/ui/KaraokeTranscript';
import { useProgress } from '@/hooks/useProgress';

export function Player() {
  const { id } = useParams<{ id: string }>();
  const { currentVoice } = useVoice();
  const { hardMode } = useUser();
  const { data: activityData, loading, error } = useActivityData(id);
  const { logProgress } = useProgress();

  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioHasPlayed, setAudioHasPlayed] = useState(false);
  
  // Track time spent on activity
  const [startTime] = useState<number>(Date.now());

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
  const dynamicAudioSrc = getAudioPath(activityData, currentVoice);
  const isScenario = !!activityData.noiseSrc;

  const handleAnswer = (isCorrect: boolean, questionId: string, userAnswer: string) => {
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    
    // Log to Smart Coach
    logProgress({
        contentType: 'story', // or scenario, ideally passed in metadata
        contentId: activityData.id,
        result: isCorrect ? 'correct' : 'incorrect',
        userResponse: userAnswer,
        correctResponse: 'TODO: Fetch correct answer text', 
        responseTimeMs: Date.now() - startTime, // Rough estimate of time spent
        metadata: {
            voiceId: currentVoice,
            noiseLevel: isScenario ? 'mixed' : 'quiet'
        }
    });
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
            ) : activityData.transcript && (activityData as any).alignmentData ? (
              <KaraokeTranscript
                transcript={activityData.transcript}
                alignmentData={(activityData as any).alignmentData}
                currentTime={currentTime}
                voiceId={currentVoice}
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
                <div className="h-8 w-1 bg-brand-primary-500 rounded-full" />
                <h2 className="text-xl font-bold text-brand-dark-800">Comprehension Check</h2>
              </div>
              
              {activityData.questions.map(q => (
                <QuizCard 
                  key={q.id} 
                  question={q} 
                  onAnswer={(isCorrect) => handleAnswer(isCorrect, q.id, "selected_choice_id")} 
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}