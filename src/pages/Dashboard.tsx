import { useState } from 'react';
import { Play, Flame, ArrowRight, Activity, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HeaRing } from '@/components/ui/HeaRing';
import { ProgressHistory } from '@/components/ui/ProgressHistory';
import { cn } from '@/lib/utils';
import { useUser } from '@/store/UserContext';
import { useTheme } from '@/store/ThemeContext';

export function Dashboard() {
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const { dailyGoal, setDailyGoal, dailyProgress, weeklyHistory } = useUser();
  const { theme, toggleTheme } = useTheme();

  const handleEditGoal = () => {
    const newGoal = window.prompt("Set your daily practice goal (minutes):", dailyGoal.toString());
    if (newGoal && !isNaN(Number(newGoal))) {
      setDailyGoal(Number(newGoal));
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="relative h-screen flex flex-col bg-gray-50 dark:bg-brand-dark pb-32">


      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 p-6 max-w-md mx-auto flex-1 flex flex-col justify-between"
      >
        {/* Header */}
        <motion.header variants={item} className="flex justify-between items-center shrink-0 mb-4">
          <button
              onClick={toggleTheme}
              className="p-3 bg-brand-background dark:bg-brand-dark shadow-neumo-concave dark:shadow-dark-neumo-concave rounded-full text-brand-dark dark:text-brand-light hover:shadow-neumo-convex dark:hover:shadow-dark-neumo-convex hover:text-brand-secondary transition-all duration-300 transform active:scale-95"
              aria-label="Toggle Theme"
          >
              {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
          </button>
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-brand-primary/10 backdrop-blur-sm text-brand-primary px-3 py-1.5 rounded-full font-bold text-xs shadow-sm border border-brand-primary/20">
                <Flame size={14} fill="currentColor" className="animate-pulse" />
                <span>12 Day Streak</span>
              </div>
          </div>
        </motion.header>

        {/* Main Stats Card (Flexible Height) */}
        <motion.div variants={item} className="flex-1 min-h-0 flex flex-col relative group rounded-[2.5rem] bg-brand-background dark:bg-brand-dark shadow-neumo-convex dark:shadow-dark-neumo-convex overflow-hidden">

          <button
              onClick={handleEditGoal}
              className="absolute top-6 right-6 z-20 p-3 bg-brand-background dark:bg-brand-dark shadow-neumo-concave dark:shadow-dark-neumo-concave rounded-full text-brand-dark dark:text-brand-light hover:shadow-neumo-convex dark:hover:shadow-dark-neumo-convex hover:text-brand-primary transition-all duration-300 transform active:scale-95"
              aria-label="Adjust Goal"
          >
              <SettingsIcon size={24} />
          </button>
          
          {/* Card Content Layer */}
          <div className="relative z-10 flex flex-col h-full p-6">
            {/* Segmented Control */}
            <div className="flex justify-center mb-6 shrink-0">
              <div className="bg-brand-background dark:bg-brand-dark p-1.5 rounded-full flex items-center shadow-neumo-concave dark:shadow-dark-neumo-concave">
                <button
                  onClick={() => setViewMode('today')}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300",
                    viewMode === 'today'
                      ? "bg-brand-background dark:bg-brand-dark text-brand-dark dark:text-brand-light shadow-neumo-convex dark:shadow-dark-neumo-convex transform scale-105"
                      : "text-gray-500 dark:text-gray-400 hover:text-brand-dark dark:hover:text-brand-light"
                  )}
                >
                  Today
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300",
                    viewMode === 'week'
                      ? "bg-brand-background dark:bg-brand-dark text-brand-dark dark:text-brand-light shadow-neumo-convex dark:shadow-dark-neumo-convex transform scale-105"
                      : "text-gray-500 dark:text-gray-400 hover:text-brand-dark dark:hover:text-brand-light"
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
                    className="flex flex-col items-center"
                  >
                    <HeaRing current={dailyProgress} goal={dailyGoal} size={200} />
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-4 font-medium text-center px-8">
                      <span className="text-brand-primary font-bold text-lg">{Math.max(0, dailyGoal - dailyProgress)} mins</span>
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
                    <div className="flex items-center justify-between mb-6 text-gray-400 font-medium text-sm uppercase tracking-wider px-2">
                      <div className="flex items-center gap-2">
                          <Activity size={16} /> Activity Trends
                      </div>
                      <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-md font-bold">Goal: {dailyGoal}m</span>
                    </div>
                    <div className="flex-1 min-h-[200px]">
                      <ProgressHistory data={weeklyHistory} goal={dailyGoal} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Bottom Action Area (Anchored) */}
        <motion.div variants={item} className="mt-6 shrink-0">
          <Link to="/practice" className="block group">
            <div className="relative overflow-hidden bg-brand-background dark:bg-brand-dark p-6 rounded-[2rem] shadow-neumo-convex dark:shadow-dark-neumo-convex transition-all transform active:scale-95 hover:scale-[1.02]">
              
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 text-[#333333] text-[10px] font-bold uppercase tracking-wider">
                    <Play size={10} fill="currentColor" />
                    <span>Up Next</span>
                  </div>
                  <h3 className="text-[#000000] text-2xl font-extrabold">Coffee Shop Chaos</h3>
                </div>
                <div className="bg-brand-background dark:bg-brand-dark text-brand-primary w-16 h-16 rounded-full flex items-center justify-center shadow-neumo-concave dark:shadow-dark-neumo-concave group-hover:shadow-neumo-convex dark:group-hover:shadow-dark-neumo-convex transition-all duration-300">
                  <ArrowRight size={28} />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
