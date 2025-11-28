import { useState } from 'react';
import { Play, Flame, ArrowRight, Activity, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HeaRing } from '@/components/ui/HeaRing';
import { ProgressHistory } from '@/components/ui/ProgressHistory';
import { cn } from '@/lib/utils';
import { useUser } from '@/store/UserContext';

export function Dashboard() {
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const { dailyGoal = 25, setDailyGoal } = useUser();

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [tempGoal, setTempGoal] = useState(dailyGoal.toString());

  // Mock data - replace with real data later
  const dailyProgress = 13; // Example progress
  const weekData = [
    { day: 'Mon', minutes: 15 },
    { day: 'Tue', minutes: 20 },
    { day: 'Wed', minutes: 25 },
    { day: 'Thu', minutes: 18 },
    { day: 'Fri', minutes: 22 },
    { day: 'Sat', minutes: 30 },
    { day: 'Sun', minutes: dailyProgress },
  ];

  // Safe calculation of remaining minutes
  const remainingMinutes = Math.max(0, (dailyGoal || 0) - (dailyProgress || 0));

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-transparent pb-32">
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 p-6 max-w-md mx-auto flex-1 flex flex-col justify-between"
      >
        {/* Header */}
        <motion.header variants={item} className="flex justify-end items-center shrink-0 mb-4">
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-brand-primary/10 backdrop-blur-sm text-brand-primary px-3 py-1.5 rounded-full font-bold text-xs shadow-sm border border-brand-primary/20">
                <Flame size={14} className="fill-orange-500 text-orange-500" />
                <span>12 Day Streak</span>
              </div>
          </div>
        </motion.header>

        {/* Main Stats Card (Flexible Height) */}
        <motion.div variants={item} className="flex-1 min-h-0 flex flex-col relative group rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none">

          <button
              onClick={() => setShowGoalModal(true)}
              className="absolute top-6 right-6 z-20 p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Adjust Goal"
          >
              <SettingsIcon className="w-5 h-5 text-slate-400" />
          </button>
          
          {/* Card Content Layer */}
          <div className="relative z-10 flex flex-col h-full p-6">
            {/* Segmented Control */}
            <div className="flex justify-center mb-6 shrink-0">
              <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full flex items-center">
                <button
                  onClick={() => setViewMode('today')}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300",
                    viewMode === 'today'
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  Today
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300",
                    viewMode === 'week'
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  Week
                </button>
              </div>
            </div>

            {/* Swappable Content Area */}
            <div className="flex-1 flex items-center justify-center relative w-full">
              <AnimatePresence mode="wait">
                {viewMode === 'today' ? (
                  <motion.div
                    key="today"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, type: "spring" }}
                    className="flex flex-col items-center relative" // Added relative
                  >
                    <HeaRing current={dailyProgress} goal={dailyGoal} size={200} />
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-4 font-medium text-center px-8">
                      <span className="text-purple-600 dark:text-purple-400 font-bold text-lg">{remainingMinutes} mins</span>
                      <br/>until you close your ring!
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="week"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full flex flex-col"
                  >
                    {/* Simplified Header */}
                    <div className="flex items-center justify-between w-full px-2 mb-6">
                      <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                        ACTIVITY TRENDS
                      </span>
                      <button
                        onClick={() => setShowGoalModal(true)}
                        className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        GOAL: {dailyGoal || 25} MIN
                      </button>
                    </div>
                    <div className="flex-1 w-full min-h-[200px]">
                      <ProgressHistory data={weekData} goal={dailyGoal} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Bottom Action Area (Anchored) */}
        <motion.div variants={item} className="mt-6 shrink-0">
          <Link to="/practice" className="block">
            <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none p-6 rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
              <div className="relative z-10 flex items-center justify-between w-full">
                <div className="flex-1 mr-6"> {/* Add margin-right for spacing */}
                  <div className="flex items-center gap-2 mb-1.5 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                    <Play size={10} fill="currentColor" />
                    <span>Up Next</span>
                  </div>
                  <h3 className="text-slate-900 dark:text-white text-2xl font-black tracking-tight">Coffee Shop Chaos</h3>
                  <div className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
                    Intermediate • 5 min
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                  <ArrowRight size={24} className="text-purple-600" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>
      {showGoalModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 w-[90%] max-w-sm border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Set Daily Goal</h3>
            <input
              type="number"
              value={tempGoal}
              onChange={(e) => setTempGoal(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white mb-4"
              min="1"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowGoalModal(false)}
                className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const newGoal = Number(tempGoal);
                  if (!isNaN(newGoal) && newGoal > 0) {
                    setDailyGoal(newGoal);
                  }
                  setShowGoalModal(false);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
