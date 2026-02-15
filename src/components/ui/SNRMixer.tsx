import { Play, Pause, Loader2, Volume1, Volume2 } from 'lucide-react';
import { useAudioMixer } from '@/hooks/useAudioMixer';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SNRMixerProps {
  voiceSrc: string;
  noiseSrc: string;
  className?: string;
}

export function SNRMixer({ voiceSrc, noiseSrc, className }: SNRMixerProps) {
  const { isPlaying, isLoading, noiseLevel, setNoiseLevel, togglePlay } = useAudioMixer({ 
    voiceSrc, 
    noiseSrc 
  });

  return (
    <div className={cn("bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-8", className)}>
      {/* Play Controls with Pulsing Animation */}
      <div className="flex justify-center relative py-4">
        {isPlaying && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                className="absolute inset-0 m-auto w-20 h-20 bg-teal-400/20 rounded-full z-0"
              />
              <motion.div
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 1.25, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: "easeOut" }}
                className="absolute inset-0 m-auto w-20 h-20 bg-teal-400/30 rounded-full z-0"
              />
            </>
          )}

        <button
          onClick={togglePlay}
          disabled={isLoading}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          className={cn(
            "relative z-10 flex items-center justify-center w-20 h-20 rounded-full transition-all transform active:scale-95 shadow-xl hover:shadow-2xl hover:scale-105",
            isPlaying
              ? "bg-white text-teal-500 border-2 border-teal-500/20"
              : "bg-teal-500 text-white hover:bg-teal-400"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1" />
          )}
        </button>
      </div>

      {/* Mixer Slider */}
      <div className="space-y-3 bg-slate-800/50 p-4 rounded-lg">
        <div className="flex justify-between text-xs font-medium text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1"><Volume1 size={14} /> Easier</span>
          <span className="flex items-center gap-1">Harder <Volume2 size={14} /></span>
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={noiseLevel}
          onChange={(e) => setNoiseLevel(Number(e.target.value))}
          aria-label="Background Noise Level"
          aria-valuetext={`${Math.round(noiseLevel * 100)}% background noise`}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
        />

        <div className="text-center">
          <span className="text-xs text-slate-500">Background Noise Level: {Math.round(noiseLevel * 100)}%</span>
        </div>
      </div>
    </div>
  );
}