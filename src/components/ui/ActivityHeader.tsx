import { Link } from 'react-router-dom';
import { ArrowLeft, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActivityHeaderProps {
  streak?: number;
  title?: string;
  backPath?: string;
  backLink?: string;
  className?: string;
}

export function ActivityHeader({
  streak,
  title,
  backPath,
  backLink = "/practice",
  className
}: ActivityHeaderProps) {
  const resolvedBackLink = backPath ?? backLink;
  const hasStreak = typeof streak === 'number';

  return (
    <header className={cn("flex justify-between items-center gap-3", className)}>
      <Link
        to={resolvedBackLink}
        className="flex items-center text-slate-400 hover:text-white transition-colors transform active:scale-95 shrink-0"
      >
        <ArrowLeft size={20} className="mr-1" /> Back
      </Link>

      {title ? (
        <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-center truncate">
          {title}
        </h1>
      ) : (
        <div className="flex-1" />
      )}

      {hasStreak ? (
        <motion.div
          key={streak}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.2, 1] }}
          className="flex items-center gap-1 font-bold px-4 py-1.5 rounded-full transition-all duration-300 bg-slate-900 border border-slate-800 shrink-0"
        >
          <Flame
            size={18}
            fill="currentColor"
            className={cn("text-teal-400", (streak ?? 0) >= 5 && "animate-pulse")}
          />
          <span className="text-white">{streak}</span>
        </motion.div>
      ) : (
        <div className="w-10 shrink-0" />
      )}
    </header>
  );
}
