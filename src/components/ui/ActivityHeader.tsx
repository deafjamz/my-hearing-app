import { Link } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActivityHeaderProps {
  streak: number;
  backLink?: string;
  className?: string;
}

export function ActivityHeader({ streak, backLink = "/practice", className }: ActivityHeaderProps) {
  // Dynamic Streak Styles using Vitality Palette
  const getStreakStyles = () => {
    let textColor = "text-brand-primary";
    let bgColor = "bg-brand-primary/10";
    let ringColor = "border-brand-primary/20";
    let flameColor = "#FF6B6B"; // Coral

    if (streak >= 10) {
      textColor = "text-brand-tertiary";
      bgColor = "bg-brand-tertiary/10";
      ringColor = "ring-2 ring-brand-tertiary/20";
      flameColor = "#14b8a6"; // Teal
    } else if (streak >= 5) {
      textColor = "text-brand-primary";
      bgColor = "bg-brand-primary/10";
      ringColor = "ring-1 ring-brand-primary/20";
      flameColor = "#FF6B6B"; // Coral
    }

    return {
      container: cn(textColor, bgColor, ringColor),
      flame: flameColor,
      text: textColor,
    };
  };

  const { container, flame, text } = getStreakStyles();

  return (
    <header className={cn("flex justify-between items-center", className)}>
      <Link to={backLink} className="flex items-center text-brand-dark dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-light transition-colors transform active:scale-95">
        <ArrowLeft size={20} className="mr-1" /> Back
      </Link>
      
            <motion.div
              key={streak} // Trigger animation on change
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              className={cn(
                "flex items-center gap-1 font-bold px-4 py-1.5 rounded-full transition-all duration-300 bg-brand-background dark:bg-brand-dark shadow-neumo-convex dark:shadow-dark-neumo-convex",
              )}
            >
        <span className="bg-gradient-to-r from-brand-secondary via-brand-primary to-brand-tertiary bg-clip-text text-transparent">
          <Flame size={18} fill="currentColor" className={cn(streak >= 5 && "animate-pulse")} />
        </span>
        <span className="text-brand-dark dark:text-brand-light">{streak}</span>
      </motion.div>
    </header>
  );
}