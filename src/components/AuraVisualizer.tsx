import { motion } from 'framer-motion';

/**
 * AuraVisualizer - The "Aura" Component
 *
 * Per 20_DESIGN_TOKENS.md:
 * - Brand Teal (#00A79D) - Bioluminescent
 * - Continuous breathing animation when audio is playing
 * - SNR-aware: Shows noise grain when SNR < 0 (harder difficulty)
 *
 * @param isPlaying - Whether target audio is currently playing
 * @param currentSnr - Signal-to-Noise Ratio in dB (negative = harder)
 */

interface AuraVisualizerProps {
  isPlaying: boolean;
  currentSnr: number;
}

export function AuraVisualizer({ isPlaying, currentSnr }: AuraVisualizerProps) {
  const hasNoise = currentSnr < 0;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {/* The Aura - Pulsing Circle */}
      {isPlaying && (
        <motion.div
          className="absolute w-32 h-32 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0, 167, 157, 0.4) 0%, rgba(0, 167, 157, 0) 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            ease: 'easeInOut',
            repeat: Infinity,
          }}
        >
          {/* Noise Grain Overlay (High Difficulty) */}
          {hasNoise && (
            <div
              className="absolute inset-0 rounded-full"
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
                opacity: Math.abs(currentSnr) / 10, // Stronger grain for lower SNR
              }}
            />
          )}
        </motion.div>
      )}
    </div>
  );
}
