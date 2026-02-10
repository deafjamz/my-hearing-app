import { motion, useReducedMotion } from 'framer-motion';
import { Play, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { startTodaysPlan } from '@/hooks/useTodaysPlan';
import type { TodaysPlan } from '@/hooks/useTodaysPractice';

interface TodaysPracticeCardProps {
  plan: TodaysPlan | null;
  loading: boolean;
}

export function TodaysPracticeCard({ plan, loading }: TodaysPracticeCardProps) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

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

        <button
          onClick={handleStart}
          className="w-full py-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-colors"
        >
          Practice More
        </button>
      </motion.div>
    );
  }

  // State 3 — New user (no Erber data — steps default to detection)
  const isNewUser = todayTrials === 0 && yesterdayAccuracy === null && streakDays === 0;

  if (isNewUser) {
    return (
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8"
      >
        <h2 className="text-xl font-bold text-white mb-2">Let's Get Started</h2>
        <p className="text-slate-400 text-sm mb-5">
          A quick listening check to personalize your training.
        </p>

        <button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          <Play size={20} fill="currentColor" />
          Start
        </button>
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

      <button
        onClick={handleStart}
        className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
      >
        <Play size={20} fill="currentColor" />
        Start Practice
      </button>
    </motion.div>
  );
}
