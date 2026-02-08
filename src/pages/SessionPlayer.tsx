import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/store/UserContext';
import { SessionSummary } from '@/components/SessionSummary';
import { FeedbackOverlay } from '@/components/ui/FeedbackOverlay';
import { ChevronLeft, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Session Player - Polymorphic player for program sessions
 * Handles both word pairs and sentences
 */

interface SessionItem {
  id: string;
  sequence_order: number;
  stimuli: {
    id: string;
    content_type: 'word_pair' | 'sentence';
    content_text: string;
    clinical_metadata: {
      // Word Pair fields
      word_1?: string;
      word_2?: string;
      contrast_category?: string;
      phoneme_1_ipa?: string;
      phoneme_2_ipa?: string;

      // Sentence fields
      question_text?: string;
      correct_answer?: string;
      distractor_1?: string;
      distractor_2?: string;
      distractor_3?: string;
      difficulty?: number;
      scenario?: string;
    };
    audio_assets: Array<{
      id: string;
      voice_id: string;
      storage_path: string;
    }>;
  };
}

interface Session {
  id: string;
  session_number: number;
  title: string;
  description: string;
  program_id: string;
}

export function SessionPlayer() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, voice } = useUser();
  const navigate = useNavigate();

  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<SessionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Performance tracking
  const [responses, setResponses] = useState<Array<{ correct: boolean; responseTime: number }>>([]);
  const [trialStartTime, setTrialStartTime] = useState<number>(Date.now());

  // Session complete state
  const [isComplete, setIsComplete] = useState(false);

  // Feedback state
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Audio state
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>(voice || 'sarah');

  useEffect(() => {
    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      // Fetch session metadata
      const { data: sessionData, error: sessionError } = await supabase
        .from('program_sessions')
        .select('id, session_number, title, description, program_id')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Fetch session items with stimuli and audio
      const { data: itemsData, error: itemsError } = await supabase
        .from('session_items')
        .select(`
          id,
          sequence_order,
          stimuli:stimuli_catalog (
            id,
            content_type,
            content_text,
            clinical_metadata,
            audio_assets (
              id,
              voice_id,
              storage_path
            )
          )
        `)
        .eq('session_id', sessionId)
        .order('sequence_order');

      if (itemsError) throw itemsError;

      setItems(itemsData as SessionItem[]);
      setTrialStartTime(Date.now());
    } catch (err) {
      console.error('Error fetching session data:', err);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (storagePath: string) => {
    try {
      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Get public URL from Supabase storage
      const { data } = supabase.storage.from('audio').getPublicUrl(storagePath);

      const audio = new Audio(data.publicUrl);
      setCurrentAudio(audio);
      await audio.play();
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  };

  const handleResponse = (answer: string, isCorrect: boolean) => {
    const responseTime = Date.now() - trialStartTime;

    // Show feedback
    setSelectedAnswer(answer);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    // Record response
    setResponses([...responses, { correct: isCorrect, responseTime }]);

    // Auto-advance after 1.5s
    setTimeout(() => {
      if (currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setTrialStartTime(Date.now());
        setSelectedAnswer(null);
        setFeedback(null);
      } else {
        completeSession();
      }
    }, 1500);
  };

  const completeSession = async () => {
    if (!user || !session) return;

    // Clear feedback before showing completion
    setFeedback(null);
    setSelectedAnswer(null);

    // Calculate stats
    const correctCount = responses.filter(r => r.correct).length;
    const accuracy = (correctCount / responses.length) * 100;
    const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;

    try {
      // Save progress to database
      await supabase.from('user_program_progress').upsert({
        user_id: user.id,
        program_id: session.program_id,
        session_id: session.id,
        accuracy_percent: accuracy,
        trials_total: responses.length,
        trials_correct: correctCount,
        avg_response_time_ms: Math.round(avgResponseTime),
        completed_at: new Date().toISOString(),
      });

      setIsComplete(true);
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading session...</div>
      </div>
    );
  }

  if (!session || items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Session not found or empty</div>
      </div>
    );
  }

  // Show completion screen
  if (isComplete) {
    const accuracy = (responses.filter(r => r.correct).length / responses.length) * 100;
    return (
      <SessionSummary
        sessionTitle={session.title}
        accuracy={accuracy}
        totalItems={items.length}
        correctCount={responses.filter(r => r.correct).length}
        onContinue={() => navigate(`/programs/${session.program_id}`)}
      />
    );
  }

  const currentItem = items[currentIndex];
  const stimulus = currentItem.stimuli;
  const progressPercent = ((currentIndex + 1) / items.length) * 100;

  // Get audio URL for current voice
  const audioAsset = stimulus.audio_assets.find(a => a.voice_id === selectedVoice);

  return (
    <div className="relative min-h-screen bg-slate-50">
      <FeedbackOverlay type={feedback} />

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <Link
          to={`/programs/${session.program_id}`}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </Link>
        <div className="text-sm text-slate-500">
          {currentIndex + 1} / {items.length}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto p-6 space-y-6">

        {/* Polymorphic Content Area */}
        {stimulus.content_type === 'word_pair' ? (
          <WordPairPlayer
            word1={stimulus.clinical_metadata.word_1 || ''}
            word2={stimulus.clinical_metadata.word_2 || ''}
            audioPath={audioAsset?.storage_path}
            onResponse={handleResponse}
            onPlayAudio={() => audioAsset && playAudio(audioAsset.storage_path)}
            selectedAnswer={selectedAnswer}
          />
        ) : (
          <SentencePlayer
            questionText={stimulus.clinical_metadata.question_text || ''}
            correctAnswer={stimulus.clinical_metadata.correct_answer || ''}
            distractors={[
              stimulus.clinical_metadata.distractor_1 || '',
              stimulus.clinical_metadata.distractor_2 || '',
              stimulus.clinical_metadata.distractor_3 || '',
            ]}
            audioPath={audioAsset?.storage_path}
            onResponse={handleResponse}
            onPlayAudio={() => audioAsset && playAudio(audioAsset.storage_path)}
            selectedAnswer={selectedAnswer}
          />
        )}
      </div>
    </div>
  );
}

// =====================================================================
// WORD PAIR PLAYER (RapidFire-style Focus Mode)
// =====================================================================

interface WordPairPlayerProps {
  word1: string;
  word2: string;
  audioPath?: string;
  onResponse: (answer: string, isCorrect: boolean) => void;
  onPlayAudio: () => void;
  selectedAnswer: string | null;
}

function WordPairPlayer({ word1, word2, audioPath, onResponse, onPlayAudio, selectedAnswer }: WordPairPlayerProps) {
  const [hasPlayed, setHasPlayed] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(() => {
    // Load autoplay preference from localStorage
    const saved = localStorage.getItem('wordPairAutoplay');
    return saved ? saved === 'true' : false;
  });

  useEffect(() => {
    // Auto-play only if enabled and on new audio
    if (autoplayEnabled && audioPath && !hasPlayed) {
      onPlayAudio();
      setHasPlayed(true);
    }
  }, [audioPath, autoplayEnabled]);

  const toggleAutoplay = () => {
    const newValue = !autoplayEnabled;
    setAutoplayEnabled(newValue);
    localStorage.setItem('wordPairAutoplay', newValue.toString());
  };

  const handleAnswer = (selectedWord: string) => {
    // Determine correct answer from audio path
    // Audio path format: "audio/words_v2/sarah/bat.mp3"
    // Extract the word from the filename (before .mp3)
    let correctWord = '';
    if (audioPath) {
      const filename = audioPath.split('/').pop() || ''; // Get "bat.mp3"
      correctWord = filename.replace('.mp3', '').toLowerCase(); // Get "bat"
    }

    // Check if selected word matches the audio
    const isCorrect = selectedWord.toLowerCase() === correctWord;
    onResponse(selectedWord, isCorrect);
  };

  return (
    <div className="space-y-6">
      {/* Autoplay Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🔄</div>
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
      </div>

      {/* Audio Replay Button */}
      <button
        onClick={() => {
          onPlayAudio();
          setHasPlayed(true);
        }}
        className="w-full p-8 bg-gradient-to-br from-teal-900/40 to-teal-800/40 border-2 border-teal-700 rounded-3xl hover:from-teal-900/60 hover:to-teal-800/60 transition-all"
      >
        <div className="text-center">
          <div className="text-6xl mb-4">🔊</div>
          <p className="text-white font-bold text-lg">Listen</p>
        </div>
      </button>

      {/* Answer Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleAnswer(word1)}
          className="p-8 bg-slate-900 border-2 border-slate-700 rounded-2xl hover:border-teal-500 transition-all"
        >
          <p className="text-white font-bold text-2xl">{word1}</p>
        </button>

        <button
          onClick={() => handleAnswer(word2)}
          className="p-8 bg-slate-900 border-2 border-slate-700 rounded-2xl hover:border-teal-500 transition-all"
        >
          <p className="text-white font-bold text-2xl">{word2}</p>
        </button>
      </div>
    </div>
  );
}

// =====================================================================
// SENTENCE PLAYER (SentenceTraining-style Question Mode)
// =====================================================================

interface SentencePlayerProps {
  questionText: string;
  correctAnswer: string;
  distractors: string[];
  audioPath?: string;
  onResponse: (answer: string, isCorrect: boolean) => void;
  onPlayAudio: () => void;
  selectedAnswer: string | null;
}

function SentencePlayer({ questionText, correctAnswer, distractors, audioPath, onResponse, onPlayAudio, selectedAnswer }: SentencePlayerProps) {
  const [hasPlayed, setHasPlayed] = useState(false);

  // Shuffle answers - recalculates when question/answers change
  const shuffledAnswers = useMemo(() => {
    const allAnswers = [correctAnswer, ...distractors]
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
    return allAnswers.sort(() => Math.random() - 0.5);
  }, [questionText, correctAnswer, ...distractors]);

  useEffect(() => {
    // Reset hasPlayed when question changes
    setHasPlayed(false);
  }, [questionText]);

  const handleAnswer = (answer: string) => {
    const isCorrect = answer === correctAnswer;
    onResponse(answer, isCorrect);
  };

  const showResult = selectedAnswer !== null;

  return (
    <div className="space-y-6">
      {/* Audio Button */}
      <button
        onClick={() => {
          onPlayAudio();
          setHasPlayed(true);
        }}
        className="w-full p-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-3xl hover:from-teal-500 hover:to-teal-500 transition-all shadow-lg"
      >
        <div className="text-center">
          <div className="text-6xl mb-2">🔊</div>
          <p className="text-white font-bold text-lg">{hasPlayed ? 'Listen Again' : 'Listen'}</p>
        </div>
      </button>

      {/* Question */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <p className="text-lg font-semibold text-slate-900 text-center">
          {questionText}
        </p>
      </div>

      {/* Answer Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {shuffledAnswers.map((answer, idx) => {
          const isSelected = selectedAnswer === answer;
          const isCorrect = answer === correctAnswer;

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(answer)}
              disabled={selectedAnswer !== null}
              className={`
                py-6 px-4 rounded-xl font-bold text-center transition-all text-lg flex items-center justify-center gap-2
                ${!showResult && 'bg-teal-50 text-teal-700 hover:bg-teal-100 active:scale-95 border-2 border-teal-200'}
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
  );
}
