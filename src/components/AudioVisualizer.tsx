import { useEffect, useState } from 'react';

/**
 * AudioVisualizer - The "Aura" Component
 *
 * Per 20_DESIGN_TOKENS.md:
 * - Idle: Invisible
 * - Active: Pulsing Teal (#00A79D)
 * - High Noise (SNR < 0): Subtle static/grain overlay
 *
 * @param isPlaying - Whether audio is currently playing
 * @param snr - Signal-to-Noise Ratio (dB). Negative = harder (more noise)
 */

interface AudioVisualizerProps {
  isPlaying: boolean;
  snr?: number;
}

export function AudioVisualizer({ isPlaying, snr = 10 }: AudioVisualizerProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Fade in/out the aura when playing state changes
  useEffect(() => {
    if (isPlaying) {
      setIsVisible(true);
    } else {
      // Delay fade out to let animation complete
      const timeout = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isPlaying]);

  const hasNoise = snr < 0;

  return (
    <div className="relative flex items-center justify-center">
      {/* The Aura - Pulsing Circle */}
      <div
        className={`
          absolute w-32 h-32 rounded-full
          transition-opacity duration-300
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          background: 'radial-gradient(circle, rgba(0, 167, 157, 0.4) 0%, rgba(0, 167, 157, 0) 70%)',
          animation: isPlaying ? 'breathing 2s ease-in-out infinite' : 'none',
        }}
      />

      {/* Noise Grain Overlay (High Difficulty) */}
      {hasNoise && isVisible && (
        <div
          className="absolute w-32 h-32 rounded-full pointer-events-none"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 1px,
                rgba(255, 255, 255, 0.03) 1px,
                rgba(255, 255, 255, 0.03) 2px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 1px,
                rgba(255, 255, 255, 0.03) 1px,
                rgba(255, 255, 255, 0.03) 2px
              )
            `,
            mixBlendMode: 'overlay',
            opacity: Math.abs(snr) / 10, // Stronger grain for lower SNR
          }}
        />
      )}

      {/* CSS Keyframes for Breathing Animation */}
      <style>{`
        @keyframes breathing {
          0%, 100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
}
