import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useKaraokePlayer } from '@/hooks/useKaraokePlayer';
import { useProgress } from '@/hooks/useProgress';
import { getVoiceGender } from '@/lib/voiceGender';
import { getStorageUrl } from '@/lib/audio';
import { supabase } from '@/lib/supabase';
import { ActivityHeader } from '@/components/ui/ActivityHeader';
import { Button } from '@/components/primitives';

// Define types for our data
interface Story {
  id: string;
  title: string;
  cover_image_url?: string;
  audio_female_path: string;
  alignment_female_path: string;
  // Add other voice paths as needed
}
interface StoryQuestion {
  id: string;
  question_text: string;
  answer_options: string[];
  correct_answer: string;
  question_type: string; // Ensure this is part of the type
  phonemic_target?: string; // Ensure this is part of the type
}
type GameState = 'difficulty_selection' | 'playing' | 'challenge' | 'results';
type TextVisibility = 'Full' | 'Partial' | 'None';


// --- Child Components ---
const DifficultySelector = ({ onStart }: { onStart: (difficulty: TextVisibility) => void }) => (
  <div className="p-8 max-w-lg mx-auto">
    <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-6">Choose Your Challenge</h2>
    <div className="grid grid-cols-1 gap-4">
      <button onClick={() => onStart('Full')} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-teal-500 transition-colors">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Full Support</h3>
        <p className="text-slate-500 dark:text-slate-400">See all text, karaoke-style.</p>
      </button>
      <button onClick={() => onStart('Partial')} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-teal-500 transition-colors">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Partial Support</h3>
        <p className="text-slate-500 dark:text-slate-400">Some words are hidden.</p>
      </button>
      <button onClick={() => onStart('None')} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left hover:border-teal-500 transition-colors">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">No Support</h3>
        <p className="text-slate-500 dark:text-slate-400">Pure listening challenge.</p>
      </button>
    </div>
  </div>
);

const KaraokeDisplay = ({ story, onEnded, textVisibility }: { story: Story; onEnded: () => void; textVisibility: TextVisibility }) => {
  const { 
    words, 
    activeWordIndex, 
    isPlaying, 
    togglePlay 
  } = useKaraokePlayer(getStorageUrl(story.audio_female_path), getStorageUrl(story.alignment_female_path), { onEnded });

  const renderTranscript = () => {
    if (textVisibility === 'None') {
      return (
        <p className="text-slate-500 italic h-48 flex items-center justify-center">
          Listen carefully...
        </p>
      );
    }
    
    return (
      <p className="text-2xl md:text-3xl leading-relaxed font-serif text-slate-800 dark:text-slate-300 transition-colors duration-150">
        {words.map((word, index) => {
          const isHidden = textVisibility === 'Partial' && index % 2 !== 0;
          const isActive = activeWordIndex === index;

          return (
            <span
              key={index}
              className={`
                ${isActive ? 'text-teal-500 dark:text-teal-400' : ''}
                ${isHidden ? 'text-slate-300 dark:text-slate-700' : ''}
              `}
            >
              {isHidden ? '_____' : word}{' '}
            </span>
          );
        })}
      </p>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-prose mx-auto">
          {renderTranscript()}
        </div>
      </main>
      <footer className="sticky bottom-0 z-10 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center">
          <button onClick={togglePlay} className="p-6 rounded-full bg-teal-500 text-white font-bold text-lg">
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      </footer>
    </div>
  );
};

const QuizChallenge = ({ questions, onSubmit }: { questions: StoryQuestion[], onSubmit: (answers: Record<string, string>) => void }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleNextQuestion = () => {
    const updatedAnswers = { ...userAnswers, [currentQuestion.id]: selectedAnswer! };
    setUserAnswers(updatedAnswers);
    setSelectedAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      onSubmit(updatedAnswers);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
        {currentQuestion.question_text}
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {currentQuestion.answer_options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleSelectAnswer(option)}
            className={`p-4 rounded-lg text-left w-full border
              ${selectedAnswer === option 
                ? 'bg-teal-100 dark:bg-teal-900 border-teal-500' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`
            }
          >
            {option}
          </button>
        ))}
      </div>
      <Button
        size="md"
        onClick={handleNextQuestion}
        disabled={!selectedAnswer}
        className="mt-8 w-full rounded-lg disabled:bg-slate-400 disabled:text-white"
      >
        {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
      </Button>
    </div>
  );
};

const ResultsScreen = ({ score, total }: { score: number, total: number }) => (
    <div className="p-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Results</h2>
        <p className="text-5xl font-bold text-slate-900 dark:text-white">{score} / {total}</p>
    </div>
);


// --- Main Player Component --- 
export function StoryPlayer() {
  const { id } = useParams<{ id: string }>();
  const storyId = id || 'story_001_whispering_woods';
  
  const [gameState, setGameState] = useState<GameState>('difficulty_selection');
  const [story, setStory] = useState<Story | null>(null);
  const [questions, setQuestions] = useState<StoryQuestion[]>([]);
  const [loading, setLoading] = useState(true); // Unified loading state
  const [difficulty, setDifficulty] = useState<TextVisibility>('Full');
  const [score, setScore] = useState(0);

  const { logProgress } = useProgress();

  // Data Fetching
  useEffect(() => {
    const fetchStoryData = async () => {
      setLoading(true);
      const [storyRes, questionsRes] = await Promise.all([
        supabase.from('stories').select('*').eq('id', storyId).single(),
        supabase.from('story_questions').select('*').eq('story_id', storyId)
      ]);
      
      if (storyRes.data) setStory(storyRes.data);
      if (questionsRes.data) setQuestions(questionsRes.data);
      
      setLoading(false);
    };
    fetchStoryData();
  }, [storyId]);


  const handleStartStory = (selectedDifficulty: TextVisibility) => {
    setDifficulty(selectedDifficulty);
    setGameState('playing');
  };

  const handleStoryEnd = () => {
    if (questions.length > 0) {
      setGameState('challenge');
    } else {
      setGameState('results');
    }
  };
  
  const handleQuizSubmit = (finalAnswers: Record<string, string>) => {
    let finalScore = 0;
    questions.forEach((q, idx) => {
      const userAnswer = finalAnswers[q.id];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) {
        finalScore++;
      }

      logProgress({
        contentType: 'story_question',
        contentId: q.id,
        result: isCorrect ? 'correct' : 'incorrect',
        userResponse: userAnswer,
        correctResponse: q.correct_answer,
        metadata: {
          activityType: 'story',
          storyId: story!.id,
          voiceGender: getVoiceGender('sarah'), // Stories currently use female voice
          trialNumber: idx,
          questionType: q.question_type,
          phonemicTarget: q.phonemic_target,
          difficulty: difficulty,
        }
      });
    });

    setScore(finalScore);
    setGameState('results');
  };
  
  const renderLoadingOrError = () => (
    <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500">Loading Story...</p>
    </div>
  );

  const renderGameState = () => {
    if (!story) return null;

    switch (gameState) {
      case 'difficulty_selection':
        return <DifficultySelector onStart={handleStartStory} />;
      case 'playing':
        return <KaraokeDisplay story={story} onEnded={handleStoryEnd} textVisibility={difficulty} />;
      case 'challenge':
        return <QuizChallenge questions={questions} onSubmit={handleQuizSubmit} />;
      case 'results':
        return <ResultsScreen score={score} total={questions.length} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <header className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md p-4 border-b border-slate-200/50 dark:border-slate-800/50">
        <ActivityHeader title={story?.title || "Story"} backPath="/practice/stories" />
      </header>
      <main className="flex-1 flex flex-col">
        {loading ? renderLoadingOrError() : renderGameState()}
      </main>
    </div>
  );
}