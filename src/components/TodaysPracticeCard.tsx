import { motion, useReducedMotion } from 'framer-motion';
import { Play, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { startTodaysPlan } from '@/hooks/useTodaysPlan';
import type { TodaysPlan } from '@/hooks/useTodaysPractice';
import { Button } from '@/components/primitives';
import { useUser } from '@/store/UserContext';
import { shouldUsePlacementAssessment } from '@/lib/languageLaunchSupport';

interface TodaysPracticeCardProps {
  plan: TodaysPlan | null;
  loading: boolean;
}

export function TodaysPracticeCard({ plan, loading }: TodaysPracticeCardProps) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const { preferredLanguage } = useUser();

  if (loading || !plan) return null;

  const { steps, todayTrials, dailyGoalMet, streakDays, yesterdayAccuracy } = plan;

  const handleStart = () => {
    startTodaysPlan(steps, navigate);
  };

  // State 2 — Goal met today
  if (dailyGoalMet) {
    return (
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
            <Check className="h-5 w-5 text-teal-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Today's Practice Complete</h2>
        </div>

        <p className="text-slate-400 text-sm mb-4">
          {todayTrials} exercises done
          {streakDays > 0 && <span className="ml-1">· {streakDays}-day streak</span>}
        </p>

        <Button
          variant="secondary"
          size="md"
          onClick={handleStart}
          className="w-full rounded-2xl border-slate-700"
        >
          Practice More
        </Button>
      </motion.div>
    );
  }

  // State 3 — New user (no Erber data — steps default to detection)
  const isNewUser = todayTrials === 0 && yesterdayAccuracy === null && streakDays === 0;
  const hasPlacement = !!localStorage.getItem('soundsteps_placement');
  const usesPlacement = shouldUsePlacementAssessment(preferredLanguage);

  if (isNewUser && (!hasPlacement || !usesPlacement)) {
    return (
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8"
      >
        <h2 className="text-xl font-bold text-white mb-2">
          {preferredLanguage === 'es' ? 'Spanish Foundation Ready' : "Let's Get Started"}
        </h2>
        <p className="text-slate-400 text-sm mb-5">
          {preferredLanguage === 'es'
            ? 'Spanish launch starts with core listening practice instead of the English listening check.'
            : 'A quick listening check to personalize your training.'}
        </p>

        <Button
          size="lg"
          onClick={() => navigate(preferredLanguage === 'es' ? '/practice/detection' : '/placement')}
          className="shadow-lg rounded-2xl flex items-center justify-center gap-2"
        >
          <Play size={20} fill="currentColor" />
          {preferredLanguage === 'es' ? 'Start Spanish Practice' : 'Start Listening Check'}
        </Button>
      </motion.div>
    );
  }

  if (isNewUser && hasPlacement) {
    return (
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8"
      >
        <h2 className="text-xl font-bold text-white mb-2">Ready to Train</h2>
        <p className="text-slate-400 text-sm mb-5">
          Your personalized plan is ready. Let's go!
        </p>

        <Button
          size="lg"
          onClick={handleStart}
          className="shadow-lg rounded-2xl flex items-center justify-center gap-2"
        >
          <Play size={20} fill="currentColor" />
          Start Practice
        </Button>
      </motion.div>
    );
  }

  // State 1 — Ready to practice (default)
  const stepLabels = steps.map(s => s.label).join(' → ');

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8"
    >
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Today's Practice</p>
      <h2 className="text-lg font-bold text-white mb-1">{stepLabels}</h2>
      <p className="text-slate-400 text-sm mb-4">
        ~10 min · {steps.length * 10} exercises
      </p>

      {/* Context line */}
      <div className="flex items-center gap-4 text-sm text-slate-400 mb-5">
        {yesterdayAccuracy !== null && (
          <span>Last session: {yesterdayAccuracy}% correct</span>
        )}
        {streakDays > 0 && (
          <span>{streakDays}-day streak</span>
        )}
      </div>

      <Button
        size="lg"
        onClick={handleStart}
        className="shadow-lg rounded-2xl flex items-center justify-center gap-2"
      >
        <Play size={20} fill="currentColor" />
        Start Practice
      </Button>
    </motion.div>
  );
}
