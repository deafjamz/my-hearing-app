import { ButtonHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { hapticSelection } from '@/lib/haptics';

/**
 * HapticButton - Reusable button with automatic haptic feedback
 *
 * Per 20_DESIGN_TOKENS.md:
 * - Triggers hapticSelection() (Light Impact) on touch
 * - Lower latency than onClick (uses onTouchStart)
 * - Supports custom Tailwind classes via tailwind-merge
 *
 * Usage:
 * <HapticButton className="bg-purple-600">Click Me</HapticButton>
 */

interface HapticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const HapticButton = forwardRef<HTMLButtonElement, HapticButtonProps>(
  ({ children, className, onClick, onTouchStart, ...props }, ref) => {
    const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
      // Trigger haptic feedback on touch (lower latency)
      hapticSelection();

      // Call custom onTouchStart if provided
      onTouchStart?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Fallback for mouse clicks (desktop)
      hapticSelection();

      // Call custom onClick if provided
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        className={twMerge(
          // Default button styles
          'transition-all duration-200 active:scale-95',
          // Custom classes (can override defaults)
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

HapticButton.displayName = 'HapticButton';
