/**
 * SoundSteps Design Tokens
 *
 * This file defines the visual language for the SoundSteps application.
 * All colors, shadows, spacing, and animations should reference these tokens.
 *
 * Design Philosophy: OLED-Safe Dark Mode + Bioluminescent Accents
 * - Deep blacks preserve battery on OLED screens
 * - High contrast text for hearing aid users who may have vision needs
 * - Warm accent colors for energy and optimism
 */

export const tokens = {
  /**
   * Color Palette
   *
   * Canvas: Deep blacks/grays for backgrounds (OLED-safe)
   * Text: High contrast whites/grays
   * Brand: Bioluminescent teal and amber for CTAs and highlights
   * Status: Semantic colors for feedback
   */
  colors: {
    // The Canvas (OLED Safe)
    background: {
      default: '#0A0E14',    // Deep blue-black (The Clearing identity)
      surface: '#141A23',    // Elevated surface
      elevated: '#1E2530',   // Cards, modals
    },

    // High Contrast Text
    text: {
      primary: '#F2F2F7',    // Primary text - high contrast
      secondary: '#AEAEB2',  // Secondary text
      muted: '#8E8E93',      // Disabled/placeholder
    },

    // The Signal (Bioluminescent Brand)
    brand: {
      teal: '#008F86',       // Primary CTA, success states
      amber: '#FFB300',      // Secondary CTA, highlights, rewards
      tealLight: '#00CFC3',  // Hover states
      amberLight: '#FFD54F', // Hover states
    },

    // Semantic Status Colors
    status: {
      success: '#4CAF50',    // Correct answers, achievements
      error: '#FF453A',      // Incorrect, warnings
      warning: '#FFB300',    // Alerts (shares amber)
      info: '#008F86',       // Information (shares teal)
    },

    // Neumorphic Base (for light mode, if enabled)
    neumorphic: {
      base: '#E0E5EC',
      light: '#FFFFFF',
      shadow: '#A3B1C6',
    },
  },

  /**
   * Shadows
   *
   * Dark mode: Subtle glow effects
   * Light mode: Classic neumorphic shadows
   */
  shadows: {
    // Dark mode - subtle glow
    dark: {
      sm: '0 2px 8px rgba(0, 143, 134, 0.1)',
      md: '0 4px 16px rgba(0, 143, 134, 0.15)',
      lg: '0 8px 32px rgba(0, 143, 134, 0.2)',
      glow: {
        teal: '0 0 20px rgba(0, 143, 134, 0.3)',
        amber: '0 0 20px rgba(255, 179, 0, 0.3)',
      },
    },

    // Neumorphic (light mode)
    neumorphic: {
      convex: '-6px -6px 16px rgba(255,255,255,0.8), 6px 6px 16px rgba(163,177,198,0.6)',
      concave: 'inset 6px 6px 16px rgba(163,177,198,0.6), inset -6px -6px 16px rgba(255,255,255,0.8)',
      flat: '0 4px 6px rgba(163,177,198,0.3)',
    },
  },

  /**
   * Spacing Scale
   *
   * Based on 4px grid (0.25rem)
   * Used for margins, padding, gaps
   */
  spacing: {
    '0': '0',
    px: '1px',
    '0.5': '0.125rem',  // 2px
    '1': '0.25rem',     // 4px
    '2': '0.5rem',      // 8px
    '3': '0.75rem',     // 12px
    '4': '1rem',        // 16px
    '5': '1.25rem',     // 20px
    '6': '1.5rem',      // 24px
    '8': '2rem',        // 32px
    '10': '2.5rem',     // 40px
    '12': '3rem',       // 48px
    '16': '4rem',       // 64px
    '20': '5rem',       // 80px
    '24': '6rem',       // 96px
  },

  /**
   * Border Radius
   *
   * Super-rounded for friendly, approachable feel
   * Per design system: "super-rounded corners on cards"
   */
  borderRadius: {
    none: '0',
    sm: '0.5rem',       // 8px - Small elements
    md: '1rem',         // 16px - Default cards
    lg: '1.5rem',       // 24px - Large cards
    xl: '2rem',         // 32px - Hero cards, modals
    '2xl': '2.5rem',    // 40px - Extra large
    full: '9999px',     // Pills, avatars
  },

  /**
   * Animation Presets
   *
   * Micro-interactions for tactile feedback
   * Per design system: "scale 1.02/0.98"
   */
  animation: {
    // Interaction scales
    hover: {
      scale: 1.02,
      transition: 'transform 0.15s ease-out',
    },
    active: {
      scale: 0.98,
      transition: 'transform 0.1s ease-in',
    },

    // Durations
    duration: {
      instant: '0ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },

    // Easing
    easing: {
      default: 'ease-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  /**
   * Typography
   *
   * Font sizes and line heights
   */
  typography: {
    fontFamily: {
      sans: ['Satoshi', 'General Sans', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '900',
    },
  },

  /**
   * Z-Index Scale
   *
   * Consistent layering
   */
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
  },

  /**
   * Breakpoints
   *
   * Mobile-first responsive design
   */
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

/**
 * Type exports for TypeScript consumers
 */
export type Colors = typeof tokens.colors;
export type Shadows = typeof tokens.shadows;
export type Spacing = typeof tokens.spacing;
export type BorderRadius = typeof tokens.borderRadius;
export type Animation = typeof tokens.animation;
export type Typography = typeof tokens.typography;
export type Tokens = typeof tokens;

/**
 * CSS Custom Properties generator
 *
 * Use this to generate CSS variables from tokens
 */
export function generateCSSVariables(): string {
  return `
:root {
  /* Background */
  --color-bg-default: ${tokens.colors.background.default};
  --color-bg-surface: ${tokens.colors.background.surface};
  --color-bg-elevated: ${tokens.colors.background.elevated};

  /* Text */
  --color-text-primary: ${tokens.colors.text.primary};
  --color-text-secondary: ${tokens.colors.text.secondary};
  --color-text-muted: ${tokens.colors.text.muted};

  /* Brand */
  --color-brand-teal: ${tokens.colors.brand.teal};
  --color-brand-amber: ${tokens.colors.brand.amber};

  /* Status */
  --color-status-success: ${tokens.colors.status.success};
  --color-status-error: ${tokens.colors.status.error};

  /* Shadows */
  --shadow-glow-teal: ${tokens.shadows.dark.glow.teal};
  --shadow-glow-amber: ${tokens.shadows.dark.glow.amber};

  /* Border Radius */
  --radius-sm: ${tokens.borderRadius.sm};
  --radius-md: ${tokens.borderRadius.md};
  --radius-lg: ${tokens.borderRadius.lg};
  --radius-xl: ${tokens.borderRadius.xl};
  --radius-full: ${tokens.borderRadius.full};

  /* Animation */
  --duration-fast: ${tokens.animation.duration.fast};
  --duration-normal: ${tokens.animation.duration.normal};
}
  `.trim();
}

export default tokens;
