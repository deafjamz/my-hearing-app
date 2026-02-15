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
  return (
    <header className={cn("flex justify-between items-center", className)}>
      <Link to={backLink} className="flex items-center text-slate-400 hover:text-white transition-colors transform active:scale-95">
        <ArrowLeft size={20} className="mr-1" /> Back
      </Link>

      <motion.div
        key={streak}
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1.2, 1] }}
        className="flex items-center gap-1 font-bold px-4 py-1.5 rounded-full transition-all duration-300 bg-slate-900 border border-slate-800"
      >
        <Flame size={18} fill="currentColor" className={cn("text-teal-400", streak >= 5 && "animate-pulse")} />
        <span className="text-white">{streak}</span>
      </motion.div>
    </header>
  );
}