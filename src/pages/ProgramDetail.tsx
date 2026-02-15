import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Play, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/store/UserContext';

/**
 * Program Detail - Shows all sessions in a program
 * Displays progress and "Continue" CTA
 */

interface Session {
  id: string;
  session_number: number;
  title: string;
  description: string;
  focus_phonemes: string[];
  focus_scenarios: string[];
  target_difficulty: number;
  estimated_duration_mins: number;
  is_completed?: boolean;
  accuracy?: number;
}

interface Program {
  id: string;
  title: string;
  description: string;
  total_sessions: number;
  estimated_duration_mins: number;
  difficulty_range: string;
  icon_name: string;
  color_class: string;
}

export function ProgramDetail() {
  const { programId } = useParams<{ programId: string }>();
  const { user } = useUser();
  const [program, setProgram] = useState<Program | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextSessionId, setNextSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (programId) {
      fetchProgramData();
    }
  }, [programId, user?.id]);

  const fetchProgramData = async () => {
    try {
      // Fetch program
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*')
        .eq('id', programId)
        .single();

      if (programError) throw programError;
      setProgram(programData);

      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('program_sessions')
        .select('*')
        .eq('program_id', programId)
        .order('session_number');

      if (sessionsError) throw sessionsError;

      // If user is logged in, fetch completion status
      if (user?.id) {
        const { data: progressData } = await supabase
          .from('user_program_progress')
          .select('session_id, accuracy_percent')
          .eq('user_id', user.id)
          .eq('program_id', programId);

        // Create map of completed sessions
        const completedMap: Record<string, { is_completed: boolean; accuracy: number }> = {};
        progressData?.forEach(p => {
          completedMap[p.session_id] = {
            is_completed: true,
            accuracy: p.accuracy_percent || 0
          };
        });

        // Merge completion status with sessions
        const sessionsWithProgress = sessionsData.map(s => ({
          ...s,
          is_completed: completedMap[s.id]?.is_completed || false,
          accuracy: completedMap[s.id]?.accuracy
        }));

        setSessions(sessionsWithProgress);

        // Find next uncompleted session
        const nextSession = sessionsWithProgress.find(s => !s.is_completed);
        setNextSessionId(nextSession?.id || null);
      } else {
        setSessions(sessionsData);
        setNextSessionId(sessionsData[0]?.id || null);
      }
    } catch (err) {
      console.error('Error fetching program data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading program...</div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Program not found</div>
      </div>
    );
  }

  const completedCount = sessions.filter(s => s.is_completed).length;
  const progressPercent = program.total_sessions > 0 ? (completedCount / program.total_sessions) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/programs"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-4"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Programs</span>
          </Link>

          <div className="flex items-start gap-6">
            {/* Program Icon */}
            <div className={`w-20 h-20 rounded-2xl ${program.color_class} flex items-center justify-center flex-shrink-0`}>
              <span className="text-3xl">📚</span>
            </div>

            {/* Program Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{program.title}</h1>
              <p className="text-slate-400 mb-4">{program.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>{program.total_sessions} sessions</span>
                <span>•</span>
                <span>{program.estimated_duration_mins} minutes</span>
                <span>•</span>
                <span>Level {program.difficulty_range}</span>
              </div>

              {/* Progress */}
              {user && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                    <span>Your Progress</span>
                    <span>{completedCount} / {program.total_sessions} sessions</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-teal-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Continue/Start Button */}
        {nextSessionId && (
          <Link
            to={`/session/${nextSessionId}`}
            className="block mb-8 p-6 bg-teal-500 hover:bg-teal-400 rounded-2xl transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-200 mb-1">
                  {completedCount === 0 ? 'Start Program' : 'Continue Training'}
                </p>
                <p className="text-white font-bold text-lg">
                  Session {sessions.find(s => s.id === nextSessionId)?.session_number}
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-7 w-7 text-white ml-1" fill="currentColor" />
              </div>
            </div>
          </Link>
        )}

        {/* Sessions List */}
        <div className="space-y-3">
          {sessions.map((session, idx) => (
            <SessionCard
              key={session.id}
              session={session}
              isNext={session.id === nextSessionId}
              delay={idx * 0.05}
            />
          ))}
        </div>

        {/* Completion Message */}
        {completedCount === program.total_sessions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-teal-900/30 border border-teal-700/50 rounded-2xl text-center"
          >
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-teal-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Program Complete!</h3>
            <p className="text-slate-400 text-sm">
              You've finished all {program.total_sessions} sessions. Keep up the great work!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session, isNext, delay }: { session: Session; isNext: boolean; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link
        to={`/session/${session.id}`}
        className={`block p-5 bg-slate-900 border rounded-xl hover:border-slate-700 transition-all group ${
          isNext ? 'border-teal-700' : 'border-slate-800'
        }`}
      >
        <div className="flex items-center gap-4">
          {/* Status Icon */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            session.is_completed
              ? 'bg-teal-500/20 border-2 border-teal-600'
              : isNext
              ? 'bg-teal-500/20 border-2 border-teal-600'
              : 'bg-slate-800 border-2 border-slate-700'
          }`}>
            {session.is_completed ? (
              <CheckCircle className="h-6 w-6 text-teal-400" />
            ) : isNext ? (
              <Play className="h-5 w-5 text-teal-400 ml-0.5" fill="currentColor" />
            ) : (
              <span className="text-slate-500 font-bold">{session.session_number}</span>
            )}
          </div>

          {/* Session Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-bold truncate">
                Session {session.session_number}: {session.title}
              </h3>
              {isNext && (
                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 text-xs font-bold rounded">
                  UP NEXT
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 truncate mb-2">{session.description}</p>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {session.focus_phonemes?.length > 0 && (
                <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded">
                  {session.focus_phonemes.join(', ')}
                </span>
              )}
              <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {session.estimated_duration_mins} min
              </span>
              {session.is_completed && session.accuracy && (
                <span className="px-2 py-1 bg-teal-500/20 text-teal-300 text-xs font-medium rounded">
                  {Math.round(session.accuracy)}% accuracy
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
