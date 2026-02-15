import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { hapticSuccess } from '@/lib/haptics';

/**
 * StepTracker - The "Ascent/Altimeter" Component
 *
 * SoundSteps Brand Metaphor:
 * - Replaces "Streak/Flame" with "Daily Ascent"
 * - Vertical progress bar like an altitude gauge
 * - Resonance effect when goal is reached
 *
 * @param current - Current step count for today
 * @param goal - Daily step goal (default: 100)
 */

interface StepTrackerProps {
  current: number;
  goal?: number;
}

export function StepTracker({ current, goal = 100 }: StepTrackerProps) {
  const [hasResonated, setHasResonated] = useState(false);
  const progress = Math.min((current / goal) * 100, 100);
  const isGoalReached = current >= goal;

  // Trigger Resonance effect when goal is reached (only once per session)
  useEffect(() => {
    if (isGoalReached && !hasResonated) {
      // Double tap haptic feedback
      hapticSuccess();
      setTimeout(() => hapticSuccess(), 150);
      setHasResonated(true);
    }
  }, [isGoalReached, hasResonated]);

  return (
    <div className="flex items-center gap-4">
      {/* The Altimeter - Vertical Progress Bar */}
      <div className="relative flex flex-col items-center">
        {/* Background Track */}
        <div className="relative h-[120px] w-4 bg-slate-800 dark:bg-slate-800 rounded-full overflow-hidden">
          {/* Tick Marks */}
          {[75, 50, 25].map((percent) => (
            <div
              key={percent}
              className="absolute left-0 w-full h-[1px] bg-slate-600"
              style={{ bottom: `${percent}%` }}
            />
          ))}

          {/* Animated Fill */}
          <motion.div
            className={`absolute bottom-0 left-0 w-full rounded-full ${
              isGoalReached
                ? 'bg-teal-400'
                : 'bg-teal-500'
            }`}
            initial={{ height: 0 }}
            animate={{
              height: `${progress}%`,
              // Resonance: Glow/pulse when goal reached
              boxShadow: isGoalReached
                ? [
                    '0 0 10px rgba(0, 143, 134, 0.6)',
                    '0 0 20px rgba(0, 143, 134, 0.8)',
                    '0 0 10px rgba(0, 143, 134, 0.6)',
                  ]
                : '0 0 0px rgba(0, 143, 134, 0)',
            }}
            transition={{
              height: { duration: 1.2, ease: 'easeOut' },
              boxShadow: isGoalReached
                ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0 },
            }}
          />
        </div>
      </div>

      {/* Labels */}
      <div className="flex flex-col">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
          Daily Ascent
        </h3>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
          {current}
          <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">
            / {goal}
          </span>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isGoalReached ? '🎯 Goal Reached!' : 'Steps Today'}
        </p>
      </div>
    </div>
  );
}
