import { useState, useEffect } from 'react';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { QuizCard } from '@/components/ui/QuizCard';
import { minimalPairs, createMinimalPairActivity } from '@/data/minimalPairs';
import { ActivityData } from '@/types/activity';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoice } from '@/store/VoiceContext';
import { FeedbackOverlay } from '@/components/ui/FeedbackOverlay';
import { ActivityHeader } from '@/components/ui/ActivityHeader';

export function RapidFire() {
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [key, setKey] = useState(0); // To force re-render of components on new question
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isAudioPlayed, setIsAudioPlayed] = useState(false);
  
  const { currentVoice } = useVoice();

  // Load initial activity, reload if voice changes
  useEffect(() => {
    loadNextActivity();
  }, [currentVoice]);

  // Clear feedback after a short delay
  useEffect(() => {
    if (answerFeedback) {
      const timer = setTimeout(() => {
        setAnswerFeedback(null);
        if (answerFeedback === 'correct') {
            handleNext();
        }
      }, 1500); // 1.5s delay before moving on
      return () => clearTimeout(timer);
    }
  }, [answerFeedback]);

  const loadNextActivity = () => {
    const pair = minimalPairs[currentPairIndex % minimalPairs.length];
    setActivity(createMinimalPairActivity(pair, currentVoice));
    setKey(prev => prev + 1);
    setAnswerFeedback(null);
    setIsAudioPlayed(false);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setStreak(prev => prev + 1);
      setAnswerFeedback('correct');
    } else {
      setStreak(0);
      setAnswerFeedback('incorrect');
    }
  };

  const handleNext = () => {
    setCurrentPairIndex(prev => prev + 1);
    loadNextActivity();
  };

  if (!activity) return <div>Loading...</div>;

  return (
    <div className="relative min-h-screen bg-gray-50 overflow-hidden">
      {/* Full Screen Feedback Overlay */}
      <FeedbackOverlay type={answerFeedback} />

      <div className="p-6 max-w-md mx-auto space-y-6 pb-24 relative z-10">
        <ActivityHeader streak={streak} />

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl font-bold text-gray-900">Rapid Fire</h1>
          <p className="text-gray-500 text-sm">Distinguish the sounds. Keep the streak alive!</p>
        </motion.div>

        <motion.div 
          key={key} 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          <AudioPlayer 
            src={activity.audioSrc} 
            className="py-8"
            onPlay={() => setIsAudioPlayed(true)}
          />

          <QuizCard 
            question={activity.questions[0]} 
            onAnswer={handleAnswer} 
            disabled={!isAudioPlayed}
          />
        </motion.div>

        {/* Manual 'Next' button if they want to skip or if feedback is delayed */}
        <button
          onClick={handleNext}
          className="w-full py-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold text-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          Skip / Next <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}