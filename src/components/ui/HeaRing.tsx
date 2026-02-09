import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeaRingProps {
  current: number; // minutes practiced
  goal: number;    // minutes
  size?: number;   
  className?: string;
}

export function HeaRing({ current, goal, size = 200, className }: HeaRingProps) {
  // Ensure current is a valid number before calculations
  const validCurrent = typeof current === 'number' && !isNaN(current) ? current : 0;
  
  const percentage = goal > 0 ? Math.min(100, Math.max(0, (validCurrent / goal) * 100)) : 0;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-100"
        />
        
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD93D" />
            <stop offset="50%" stopColor="#FF6B6B" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>

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

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-slate-900 dark:text-white text-3xl font-bold">
          <span className="text-4xl">{Math.round(validCurrent)}</span>
          <span className="text-xl text-slate-400 dark:text-slate-500 font-medium">/{goal}</span>
        </div>
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
          Minutes
        </div>
      </div>
    </div>
  );
}
