import { Link } from 'react-router-dom';
import { Play, HeadphonesIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useProgressData } from '@/hooks/useProgressData';
import { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

/**
 * Dashboard - Stats overview (accessible from Progress or direct URL)
 * Not the default landing — Practice Hub is.
 */
export function Dashboard() {
  const { stats, loading } = useProgressData();
  const prefersReducedMotion = useReducedMotion();
  const [dailySteps, setDailySteps] = useState(0);

  // Calculate daily steps
  useEffect(() => {
    const today = new Date().toDateString();
    const todaysData = stats.progressData.filter(entry => {
      const entryDate = new Date(entry.date).toDateString();
      return entryDate === today;
    });
    const todayTrials = todaysData.reduce((sum, entry) => sum + entry.trials, 0);
    setDailySteps(todayTrials);
  }, [stats.progressData]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const goal = 100;
  const progress = Math.min((dailySteps / goal) * 100, 100);
  const isGoalReached = dailySteps >= goal;

  // SNR Progress (circular)
  const snrProgress = Math.min(Math.abs(stats.currentSNR) / 20 * 100, 100);

  // Stagger animation (disabled when user prefers reduced motion)
  const container = prefersReducedMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      };

  const item = prefersReducedMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
      };

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-400 text-sm">Your training stats</p>
        </div>

        {/* Bento Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          {/* Top Left - Daily Ascent (Large, horizontal) */}
          <motion.div
            variants={item}
            className="md:col-span-2 md:row-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-8"
          >
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-6">
              Daily Ascent
            </h3>

            {/* Horizontal Progress Bar */}
            <div className="relative">
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
                <motion.div
                  className={`h-full rounded-full ${
                    isGoalReached
                      ? 'bg-gradient-to-r from-teal-500 to-teal-400'
                      : 'bg-gradient-to-r from-teal-600 to-teal-500'
                  }`}
                  initial={prefersReducedMotion ? false : { width: 0 }}
                  animate={{
                    width: `${progress}%`,
                    boxShadow: !prefersReducedMotion && isGoalReached
                      ? [
                          '0 0 10px rgba(0, 167, 157, 0.6)',
                          '0 0 20px rgba(0, 167, 157, 0.8)',
                          '0 0 10px rgba(0, 167, 157, 0.6)',
                        ]
                      : '0 0 0px rgba(0, 167, 157, 0)',
                  }}
                  transition={prefersReducedMotion ? { duration: 0 } : {
                    width: { duration: 1.2, ease: 'easeOut' },
                    boxShadow: isGoalReached
                      ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                      : { duration: 0 },
                  }}
                />
              </div>

              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-bold text-white">
                  {dailySteps}
                </p>
                <span className="text-xl font-normal text-slate-500">
                  / {goal}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                {isGoalReached ? 'Goal Reached!' : 'Steps Today'}
              </p>
            </div>
          </motion.div>

          {/* Top Right - Current Level (Medium, circular) */}
          <motion.div
            variants={item}
            className="md:col-span-2 md:row-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-8 flex items-center gap-8"
          >
            {/* Circular Progress */}
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg className="transform -rotate-90 w-28 h-28">
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-800"
                />
                <motion.circle
                  cx="56"
                  cy="56"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={314}
                  initial={prefersReducedMotion ? false : { strokeDashoffset: 314 }}
                  animate={{ strokeDashoffset: 314 - (314 * snrProgress) / 100 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 1.5, ease: 'easeOut' }}
                  className="text-teal-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">
                    {stats.currentSNR > 0 ? '+' : ''}{stats.currentSNR}
                  </p>
                  <p className="text-xs text-slate-500">dB</p>
                </div>
              </div>
            </div>

            {/* Label */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Current Level
              </h3>
              <p className="text-2xl font-bold text-white mb-1">
                {stats.currentSNR <= 0 ? 'Advanced' : stats.currentSNR <= 10 ? 'Intermediate' : 'Beginner'}
              </p>
              <p className="text-sm text-slate-400">
                Signal-to-Noise Ratio
              </p>
            </div>
          </motion.div>

          {/* Bottom Left - Quick Start (Wide) */}
          <motion.div
            variants={item}
            className="md:col-span-3 md:row-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden group"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wide mb-3">
                  Quick Start
                </h3>
                <p className="text-3xl font-bold text-white mb-2">
                  Begin Practice
                </p>
                <p className="text-sm text-slate-400">
                  Jump into word pairs, sentences, or stories
                </p>
              </div>

              <Link
                to="/"
                className="w-24 h-24 rounded-full bg-teal-500 hover:bg-teal-400 flex items-center justify-center shadow-2xl hover:scale-105 transition-all group"
              >
                <Play className="h-10 w-10 text-white ml-1" />
              </Link>
            </div>
          </motion.div>

          {/* Bottom Right - Words Heard (Small) */}
          <motion.div
            variants={item}
            className="md:col-span-1 md:row-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6"
          >
            <div className="flex flex-col h-full justify-between">
              <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center mb-4">
                <HeadphonesIcon className="text-teal-400" size={24} />
              </div>

              <div>
                <p className="text-4xl font-bold text-white mb-2">
                  {stats.totalTrials}
                </p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Words Heard
                </p>
                <Link
                  to="/progress"
                  className="text-xs text-teal-400 hover:text-teal-300 font-medium mt-2 inline-block transition-colors"
                >
                  View Full Report →
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
