import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { SNRMixer } from '@/components/ui/SNRMixer';
import { QuizCard } from '@/components/ui/QuizCard';
import { useActivityData } from '@/hooks/useActivityData';
import { useVoice } from '@/store/VoiceContext';
import { getAudioPath } from '@/lib/audioUtils';
import { ActivityHeader } from '@/components/ui/ActivityHeader';
import { FeedbackOverlay } from '@/components/ui/FeedbackOverlay';

export function Player() {
  const { id } = useParams<{ id: string }>();
  const { currentVoice } = useVoice();
  const activityData = useActivityData(id);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Clear feedback timer
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  if (!activityData) {
    return <div className="p-8 text-center">Activity not found.</div>;
  }

  // Dynamic path resolution
  const dynamicAudioSrc = getAudioPath(activityData, currentVoice);
  const isScenario = !!activityData.noiseSrc;

  const handleAnswer = (isCorrect: boolean) => {
    setFeedback(isCorrect ? 'correct' : 'incorrect');
  };

  return (
    <div className="relative min-h-screen bg-gray-50 pb-24">
      <FeedbackOverlay type={feedback} />

      <div className="p-6 max-w-md mx-auto space-y-8 relative z-10">
        <ActivityHeader streak={0} />

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center space-y-4">
          <h1 className="text-xl font-bold text-gray-900">{activityData.title}</h1>
          
          {isScenario ? (
            <SNRMixer voiceSrc={dynamicAudioSrc} noiseSrc={activityData.noiseSrc!} />
          ) : (
            <AudioPlayer src={dynamicAudioSrc} />
          )}
          
          <div className="p-4 bg-gray-50 rounded-lg text-left text-sm text-gray-600">
            <p className="font-semibold mb-1">Transcript:</p>
            <p>{activityData.transcript}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-1 bg-primary-500 rounded-full" />
            <h2 className="text-xl font-bold text-gray-800">Comprehension Check</h2>
          </div>
          
          {activityData.questions.map(q => (
            <QuizCard 
              key={q.id} 
              question={q} 
              onAnswer={handleAnswer} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}