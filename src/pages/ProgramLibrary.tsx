import { Link } from 'react-router-dom';
import { Lock, ChevronLeft } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/store/UserContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';

/**
 * Program Library - Netflix-Style Program Cards
 * Shows all programs with tier-based access control
 */

interface Program {
  id: string;
  title: string;
  description: string;
  short_description: string;
  tier: 'free' | 'tier1' | 'tier2';
  category: string;
  total_sessions: number;
  estimated_duration_mins: number;
  difficulty_range: string;
  icon_name: string;
  color_class: string;
  completed_sessions?: number; // From user progress
}

export function ProgramLibrary() {
  const { user, profile } = useUser();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  // Map subscription tier to program tier scheme
  const tierMap: Record<string, string> = { 'Free': 'free', 'Standard': 'tier1', 'Premium': 'tier2' };
  const userTier = tierMap[profile?.subscription_tier ?? 'Free'] ?? 'free';

  useEffect(() => {
    fetchPrograms();
  }, [user?.id]);

  const fetchPrograms = async () => {
    try {
      // Fetch all published programs
      const { data: programsData, error } = await supabase
        .from('programs')
        .select('*')
        .eq('is_published', true)
        .order('order_index');

      if (error) throw error;

      // If user is logged in, fetch their progress
      if (user?.id) {
        const { data: progressData } = await supabase
          .from('user_program_progress')
          .select('program_id, session_id')
          .eq('user_id', user.id);

        // Count completed sessions per program
        const progressMap: Record<string, number> = {};
        progressData?.forEach(p => {
          progressMap[p.program_id] = (progressMap[p.program_id] || 0) + 1;
        });

        // Merge progress with programs
        const programsWithProgress = programsData?.map(prog => ({
          ...prog,
          completed_sessions: progressMap[prog.id] || 0
        }));

        setPrograms(programsWithProgress || []);
      } else {
        setPrograms(programsData || []);
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
    } finally {
      setLoading(false);
    }
  };

  const devUnlock = import.meta.env.VITE_DEV_UNLOCK_ALL === 'true';

  const isLocked = (program: Program) => {
    if (devUnlock) return false;
    if (program.tier === 'free') return false;
    if (program.tier === 'tier1' && (userTier === 'tier1' || userTier === 'tier2')) return false;
    if (program.tier === 'tier2' && userTier === 'tier2') return false;
    return true;
  };

  const container = prefersReducedMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      };

  if (loading) {
    return <LoadingSpinner message="Loading programs..." />;
  }

  // Group programs by tier
  const freePrograms = programs.filter(p => p.tier === 'free');
  const tier1Programs = programs.filter(p => p.tier === 'tier1');
  const tier2Programs = programs.filter(p => p.tier === 'tier2');

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            to="/practice"
            className="p-2 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Programs</h1>
            <p className="text-slate-400 text-sm">Structured listening practice pathways</p>
          </div>
        </div>

        {/* Free Programs */}
        {freePrograms.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">Free Programs</h2>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {freePrograms.map(program => (
                <ProgramCard key={program.id} program={program} locked={false} />
              ))}
            </motion.div>
          </div>
        )}

        {/* Tier 1 Programs */}
        {tier1Programs.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-white">Premium Programs</h2>
              {userTier === 'free' && (
                <span className="px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold rounded-full">
                  UPGRADE
                </span>
              )}
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {tier1Programs.map(program => (
                <ProgramCard key={program.id} program={program} locked={isLocked(program)} />
              ))}
            </motion.div>
          </div>
        )}

        {/* Tier 2 Programs */}
        {tier2Programs.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-white">Elite Programs</h2>
              {userTier !== 'tier2' && (
                <span className="px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-xs font-bold rounded-full">
                  ELITE
                </span>
              )}
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {tier2Programs.map(program => (
                <ProgramCard key={program.id} program={program} locked={isLocked(program)} />
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgramCard({ program, locked }: { program: Program; locked: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  const IconLookup = Icons as Record<string, LucideIcon>;
  const Icon = IconLookup[program.icon_name] || Icons.Sparkles;
  const progress = program.completed_sessions && program.total_sessions
    ? (program.completed_sessions / program.total_sessions) * 100
    : 0;

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { scale: locked ? 1 : 1.02 }}
      className={`relative group ${locked ? 'opacity-60' : ''}`}
    >
      <Link
        to={locked ? '#' : `/programs/${program.id}`}
        className={`block bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all ${
          locked ? 'cursor-not-allowed' : 'cursor-pointer'
        }`}
        onClick={(e) => locked && e.preventDefault()}
      >
        {/* Lock Icon */}
        {locked && (
          <div className="absolute top-4 right-4 z-10">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Lock className="h-5 w-5 text-slate-500" />
            </div>
          </div>
        )}

        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl ${program.color_class} flex items-center justify-center mb-4`}>
          <Icon className="h-7 w-7" strokeWidth={2.5} />
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-bold text-white mb-2">{program.title}</h3>
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{program.short_description}</p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <span>{program.total_sessions} sessions</span>
          <span>•</span>
          <span>{program.estimated_duration_mins} mins</span>
          <span>•</span>
          <span>Level {program.difficulty_range}</span>
        </div>

        {/* Progress Bar */}
        {!locked && progress > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>{Math.round(progress)}% complete</span>
              <span>{program.completed_sessions} / {program.total_sessions}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        {locked && (
          <div className="mt-4">
            <div className="px-4 py-2 bg-gradient-to-r from-violet-500/20 to-purple-600/20 border border-violet-500/30 rounded-lg text-center">
              <p className="text-sm font-medium text-violet-300">Unlock with Premium</p>
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
}
