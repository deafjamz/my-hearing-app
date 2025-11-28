import { Flame } from 'lucide-react';
import { useUser } from '../../store/UserContext';

export function StreakFlame() {
  const { currentStreak } = useUser();

  // Dynamic Styles based on Streak
  let colorClass = "text-slate-300 dark:text-slate-600"; // Default (0)
  let animationClass = "";
  
  if (currentStreak > 0) colorClass = "text-orange-400 dark:text-orange-500";
  if (currentStreak >= 5) colorClass = "text-orange-500 dark:text-orange-400 fill-orange-500"; // Solid Fill
  if (currentStreak >= 10) {
    colorClass = "text-red-500 dark:text-red-400 fill-red-500 drop-shadow-lg";
    animationClass = "animate-pulse"; 
  }
  if (currentStreak >= 20) {
    colorClass = "text-purple-500 dark:text-purple-400 fill-purple-500 drop-shadow-xl";
    animationClass = "animate-bounce";
  }

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 transition-all duration-500 ${currentStreak > 0 ? 'scale-100' : 'opacity-80'}`}>
      <Flame size={18} className={`transition-all duration-300 ${colorClass} ${animationClass}`} />
      <span className={`font-bold text-sm tabular-nums ${colorClass}`}>
        {currentStreak}
      </span>
    </div>
  );
}
