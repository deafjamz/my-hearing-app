import { Play, Pause, AlertCircle, Loader2 } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
  onEnded?: () => void;
  onPlay?: () => void;
  onTimeUpdate?: (currentTime: number) => void; // New prop
}

export function AudioPlayer({ src, title, className, onEnded, onPlay, onTimeUpdate }: AudioPlayerProps) {
  const { isPlaying, isLoading, error, togglePlay, retry } = useAudio({ src, onEnded, onTimeUpdate });

  const handleToggle = () => {
    if (error) {
      retry();
      return;
    }
    togglePlay();
    if (!isPlaying && onPlay) {
      onPlay();
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-6", className)}>
      <div className="relative">
        {/* Pulsing Rings Animation when playing */}
        {isPlaying && (
          <>
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 bg-teal-500/20 rounded-full z-0"
            />
            <motion.div
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.25, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: "easeOut" }}
              className="absolute inset-0 bg-teal-500/30 rounded-full z-0"
            />
          </>
        )}

        <button
          onClick={handleToggle}
          disabled={isLoading}
          className={cn(
            "relative z-10 flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300",
            error 
              ? "bg-red-100 text-red-500 cursor-not-allowed"
              : "bg-teal-500 hover:bg-teal-400 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
          )}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : error ? (
            <AlertCircle className="w-8 h-8" />
          ) : isPlaying ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1" />
          )}
        </button>
      </div>

      {error && <p className="text-sm text-red-400 mt-4 font-medium">{error}</p>}
      {title && !error && <h3 className="text-sm font-medium text-slate-400 mt-4 uppercase tracking-wider">{title}</h3>}
    </div>
  );
}