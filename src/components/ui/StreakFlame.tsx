import { Flame } from 'lucide-react';
import { useUser } from '../../store/UserContext';

export function StreakFlame() {
  const { currentStreak } = useUser();

  // 1. Determine Tier
  let color = "text-slate-300 dark:text-slate-600";
  let fill = "none";
  let animation = "";
  let scale = "scale-100";
  let shadow = "";

  if (currentStreak >= 1) {
    color = "text-orange-400";
    fill = "currentColor"; // Solid fill starts immediately
  }
  if (currentStreak >= 5) {
    color = "text-orange-500";
    animation = "animate-pulse"; // Gentle pulse
    scale = "scale-105";
  }
  if (currentStreak >= 10) {
    color = "text-red-500";
    fill = "red";
    animation = "animate-bounce"; // Bouncing excitement
    shadow = "drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"; // Red Glow
  }
  if (currentStreak >= 25) {
    color = "text-teal-400";
    fill = "teal";
    animation = "animate-spin-slow"; // Or a complex keyframe
    shadow = "drop-shadow-[0_0_12px_rgba(0,167,157,0.8)]"; // Teal Plasma
  }
  if (currentStreak >= 50) {
    color = "text-yellow-400"; // GOLD
    fill = "gold";
    shadow = "drop-shadow-[0_0_15px_rgba(250,204,21,1)]"; // Golden God Mode
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-all duration-500 ${scale} ${shadow}`}>
      <Flame 
        size={20} 
        className={`transition-colors duration-300 ${color} ${animation}`} 
        fill={currentStreak >= 1 ? "currentColor" : "none"}
      />
      <span className={`font-black text-sm tabular-nums ${color}`}>
        {currentStreak}
      </span>
    </div>
  );
}
