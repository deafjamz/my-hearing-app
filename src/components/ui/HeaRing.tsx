import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeaRingProps {
  current: number; // e.g., minutes practiced
  goal: number;    // e.g., 15
  size?: number;   // pixel width/height
  className?: string;
}

export function HeaRing({ current, goal, size = 200, className }: HeaRingProps) {
  const percentage = goal > 0 ? Math.min(100, Math.max(0, (current / goal) * 100)) : 0;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)} style={{ width: size, height: size }}>
      {/* Container for the SVG Ring */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-100"
        />
        
        {/* Gradient Definition (Vitality Palette) */}
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD93D" /> {/* Sunshine */}
            <stop offset="50%" stopColor="#FF6B6B" /> {/* Coral */}
            <stop offset="100%" stopColor="#6C5CE7" /> {/* Violet */}
          </linearGradient>
        </defs>

        {/* Animated Progress Path */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-slate-900 dark:text-white text-3xl font-bold">
          <span className="text-4xl">{Math.round(current)}</span>
          <span className="text-xl text-slate-400 dark:text-slate-500 font-medium">/{goal}</span>
        </div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
          Minutes
        </div>
      </div>
    </div>
  );
}