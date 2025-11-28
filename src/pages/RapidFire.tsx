import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { minimalPairs, createMinimalPairActivity } from '@/data/minimalPairs';
import { ActivityData, Question } from '@/types/activity';
import { ArrowLeft, Play, CheckCircle, XCircle } from 'lucide-react';
import { useUser } from '@/store/UserContext';
import { cn } from '@/lib/utils';

export function RapidFire() {
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [selectedGuess, setSelectedGuess] = useState<string | null>(null);
  
  const { voice } = useUser();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadNextActivity();
  }, [voice, currentPairIndex]);

  const loadNextActivity = () => {
    const pair = minimalPairs[currentPairIndex % minimalPairs.length];
    setActivity(createMinimalPairActivity(pair, voice));
    setHasGuessed(false);
    setSelectedGuess(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const playAudio = () => {
    audioRef.current?.play();
  };

  const handleGuess = (guess: string) => {
    if (hasGuessed || !activity) return;
    setSelectedGuess(guess);
    setHasGuessed(true);
  };

  const nextRound = () => {
    setCurrentPairIndex(prev => prev + 1);
  };

  if (!activity) {
    return <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950" />;
  }
  
  const question: Question = activity.questions[0];

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 dark:bg-slate-950 z-50">
      
      {/* 1. Header (Fixed Height) */}
      <div className="flex-none p-4 flex items-center justify-between z-10">
        <Link to="/practice" className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="text-slate-900 dark:text-white font-black text-lg">Rapid Fire</div>
        <div className="w-8 h-8" /> {/* Spacer for centering */}
      </div>

      {/* 2. Scrollable Game Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-40">
        <div className="max-w-md mx-auto space-y-6 pt-4">
          
          <audio ref={audioRef} src={activity.audioSrc} preload="auto" />

          {/* Play Button */}
          <div className="flex justify-center py-8">
            <button 
              onClick={playAudio}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-purple-600 shadow-xl shadow-purple-500/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all"
            >
              <Play size={40} fill="currentColor" className="ml-1" />
            </button>
          </div>

          <h2 className="text-center text-slate-900 dark:text-white font-bold text-xl mb-4">
            Which word did you hear?
          </h2>

          {/* Answer Cards */}
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleGuess(option.text)}
                disabled={hasGuessed}
                className={cn(
                  "w-full p-5 text-left font-bold text-lg rounded-2xl border-2 transition-all duration-200 shadow-sm",
                  "disabled:cursor-not-allowed",
                  hasGuessed && option.text === question.correctAnswer
                    ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-600 dark:text-green-300'
                    : hasGuessed && option.text === selectedGuess && option.text !== question.correctAnswer
                    ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-600 dark:text-red-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-purple-300 dark:hover:border-purple-600'
                )}
              >
                <div className="flex justify-between items-center">
                  <span>{option.text}</span>
                  {hasGuessed && option.text === question.correctAnswer && (
                    <CheckCircle size={20} className="text-green-500" />
                  )}
                  {hasGuessed && option.text === selectedGuess && option.text !== question.correctAnswer && (
                    <XCircle size={20} className="text-red-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Feedback Box */}
          {hasGuessed && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-5 rounded-2xl">
              <h3 className="text-blue-700 dark:text-blue-300 font-bold mb-1 flex items-center gap-2">
                Did you know?
              </h3>
              <p className="text-blue-600 dark:text-blue-200 text-sm leading-relaxed">
                The difference between "{question.options[0].text}" and "{question.options[1].text}" is often a subtle change in vowel sound or voicing.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md z-20">
        <div className="max-w-md mx-auto">
          <button 
            onClick={nextRound}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-slate-900/10"
          >
            {hasGuessed ? 'Next Round' : 'Skip'}
          </button>
        </div>
      </div>

    </div>
  );
}
