import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * The Aura - Audio Visualizer Component
 *
 * From core docs/4_design_system.md:
 * - Radial gradient that pulses with audio amplitude
 * - Teal (#008F86) = Speech/Signal
 * - Amber (#FFB300) = Noise
 *
 * Uses Web Audio API to analyze real-time audio amplitude
 */

interface AuraProps {
  audioContext?: AudioContext | null;
  audioSource?: AudioBufferSourceNode | null;
  noiseSource?: AudioBufferSourceNode | null;
  isPlaying?: boolean;
  mode?: 'speech' | 'mixed' | 'noise';
  size?: number;
  className?: string;
}

export function Aura({
  audioContext,
  audioSource,
  noiseSource,
  isPlaying = false,
  mode = 'speech',
  size = 200,
  className = '',
}: AuraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [amplitude, setAmplitude] = useState(0);

  /**
   * Initialize audio analyzer
   */
  useEffect(() => {
    if (!audioContext || !isPlaying) {
      analyserRef.current = null;
      return;
    }

    // Create analyzer node
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    // Connect audio source to analyzer
    if (audioSource) {
      try {
        audioSource.connect(analyser);
      } catch (err) {
        // Already connected or invalid state
        console.warn('Could not connect audio source to analyzer:', err);
      }
    }

    if (noiseSource) {
      try {
        noiseSource.connect(analyser);
      } catch (err) {
        console.warn('Could not connect noise source to analyzer:', err);
      }
    }

    analyserRef.current = analyser;

    return () => {
      analyser.disconnect();
    };
  }, [audioContext, audioSource, noiseSource, isPlaying]);

  /**
   * Animation loop - update amplitude from audio analyzer
   */
  useEffect(() => {
    if (!analyserRef.current || !isPlaying) {
      setAmplitude(0);
      return;
    }

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateAmplitude = () => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate average amplitude
      const sum = dataArray.reduce((acc, val) => acc + val, 0);
      const avg = sum / bufferLength;
      const normalized = avg / 255; // 0 to 1

      setAmplitude(normalized);

      animationFrameRef.current = requestAnimationFrame(updateAmplitude);
    };

    updateAmplitude();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserRef.current, isPlaying]);

  /**
   * Draw the aura on canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    const centerX = size / 2;
    const centerY = size / 2;

    // Base radius
    const baseRadius = size * 0.3;

    // Pulse radius based on amplitude
    const pulseRadius = baseRadius + amplitude * (size * 0.2);

    // Create radial gradient
    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      pulseRadius
    );

    // Color based on mode
    if (mode === 'speech') {
      // Teal gradient (Speech/Signal)
      gradient.addColorStop(0, `rgba(0, 143, 134, ${0.8 + amplitude * 0.2})`); // #008F86
      gradient.addColorStop(0.5, `rgba(0, 143, 134, ${0.4 + amplitude * 0.3})`);
      gradient.addColorStop(1, 'rgba(0, 143, 134, 0)');
    } else if (mode === 'noise') {
      // Amber gradient (Noise)
      gradient.addColorStop(0, `rgba(255, 179, 0, ${0.8 + amplitude * 0.2})`); // #FFB300
      gradient.addColorStop(0.5, `rgba(255, 179, 0, ${0.4 + amplitude * 0.3})`);
      gradient.addColorStop(1, 'rgba(255, 179, 0, 0)');
    } else {
      // Mixed mode - blend teal and amber
      const tealOpacity = 0.5 + amplitude * 0.3;
      const amberOpacity = 0.3 + amplitude * 0.2;

      // Draw teal layer
      const tealGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        pulseRadius
      );
      tealGradient.addColorStop(0, `rgba(0, 143, 134, ${tealOpacity})`);
      tealGradient.addColorStop(0.5, `rgba(0, 143, 134, ${tealOpacity * 0.5})`);
      tealGradient.addColorStop(1, 'rgba(0, 143, 134, 0)');

      ctx.fillStyle = tealGradient;
      ctx.fillRect(0, 0, size, size);

      // Draw amber layer on top
      const amberGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        pulseRadius * 0.8
      );
      amberGradient.addColorStop(0, `rgba(255, 179, 0, ${amberOpacity})`);
      amberGradient.addColorStop(0.5, `rgba(255, 179, 0, ${amberOpacity * 0.5})`);
      amberGradient.addColorStop(1, 'rgba(255, 179, 0, 0)');

      ctx.globalCompositeOperation = 'screen'; // Blend mode
      ctx.fillStyle = amberGradient;
      ctx.fillRect(0, 0, size, size);
      ctx.globalCompositeOperation = 'source-over'; // Reset blend mode
      return;
    }

    // Draw single color gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }, [amplitude, mode, size]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Canvas for gradient */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="absolute inset-0"
      />

      {/* Pulsing ring overlay */}
      {isPlaying && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{
            borderColor: mode === 'speech' ? '#008F86' : mode === 'noise' ? '#FFB300' : '#008F86',
            opacity: 0.3 + amplitude * 0.4,
          }}
          animate={{
            scale: [1, 1.1 + amplitude * 0.2, 1],
            opacity: [0.3, 0.6 + amplitude * 0.4, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Center icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isPlaying ? (
          <motion.div
            className="text-text-primary"
            animate={{
              scale: [1, 1.05 + amplitude * 0.1, 1],
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <svg
              width={size * 0.3}
              height={size * 0.3}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 5L6 9H2v6h4l5 4V5z"
                fill="currentColor"
                opacity="0.8"
              />
              <path
                d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity={0.5 + amplitude * 0.5}
              />
            </svg>
          </motion.div>
        ) : (
          <div className="text-text-secondary opacity-50">
            <svg
              width={size * 0.3}
              height={size * 0.3}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple Aura for static display (no audio analysis)
 */
export function StaticAura({
  mode = 'speech',
  size = 120,
  className = '',
}: {
  mode?: 'speech' | 'noise' | 'mixed';
  size?: number;
  className?: string;
}) {
  const colors = {
    speech: '#008F86',
    noise: '#FFB300',
    mixed: '#008F86',
  };

  return (
    <div
      className={`relative rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${colors[mode]}40, ${colors[mode]}20, transparent)`,
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-text-primary opacity-60">
          <svg
            width={size * 0.3}
            height={size * 0.3}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}
