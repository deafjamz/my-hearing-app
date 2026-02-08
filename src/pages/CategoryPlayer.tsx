import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { SessionSummary } from '@/components/SessionSummary';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/store/UserContext';
import { ActivityBriefing } from '@/components/ActivityBriefing';

/**
 * Category Player - Quick Practice mode for word pairs by category
 * Loads 10 random pairs from a specific contrast category
 */

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

  // Briefing state
  const [hasStarted, setHasStarted] = useState(false);

  const [pairs, setPairs] = useState<WordPair[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
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

      // Fetch word pairs from this category
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
        .eq('content_type', 'word_pair');

      if (error) throw error;

      // Filter by category and shuffle
      const categoryPairs = stimuli
        .filter((s: any) => s.clinical_metadata?.contrast_category === decodedCategory)
        .map((s: any) => {
          // Try selected voice first, fall back to any available voice
          const audio = s.audio_assets?.find((a: any) => a.voice_id === selectedVoice)
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
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const { data } = supabase.storage.from('audio').getPublicUrl(storagePath);
      const audio = new Audio(data.publicUrl);
      setCurrentAudio(audio);
      await audio.play();
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  };

  const toggleAutoplay = () => {
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
    setResponses(prev => [...prev, { correct: isCorrect, responseTime }]);
    setFeedback({ isCorrect, correctWord, selectedWord: selectedWord.toLowerCase() });

    const isLast = currentIndex >= pairs.length - 1;

    // Auto-advance after showing feedback
    setTimeout(() => {
      setFeedback(null);
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
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading pairs...</div>
      </div>
    );
  }

  if (pairs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-400 mb-4">No audio available for this category yet.</div>
          <p className="text-slate-500 text-sm mb-4">Audio for this category hasn't been generated. Try a different category.</p>
          <Link to="/categories" className="text-violet-400 hover:text-violet-300">
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
        onContinue={() => navigate('/categories')}
      />
    );
  }

  const currentPair = pairs[currentIndex];
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
              className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Word Pair Player */}
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
                autoplayEnabled ? 'bg-violet-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  autoplayEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Audio Button */}
          <button
            onClick={() => {
              if (currentPair.audioPath) {
                playAudio(currentPair.audioPath);
                setHasPlayed(true);
              }
            }}
            className="w-full p-8 bg-gradient-to-br from-violet-900/40 to-purple-900/40 border-2 border-violet-700 rounded-3xl hover:from-violet-900/60 hover:to-purple-900/60 transition-all"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🔊</div>
              <p className="text-white font-bold text-lg">Listen</p>
            </div>
          </button>

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
            {[currentPair.word1, currentPair.word2].map((word) => {
              let btnStyle = 'border-slate-700 hover:border-violet-500';
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
