/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === "The Clearing" Identity — Deeper Teal + Blue-Black ===
        // Override Tailwind teal with identity palette (#008F86 primary)
        teal: {
          50: '#f0fdfb',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5ce8d4',
          400: '#00CFC3',
          500: '#008F86',
          600: '#007A73',
          700: '#005F59',
          800: '#004D48',
          900: '#003D3B',
          950: '#002624',
        },
        // Override slate-950/900 for identity backgrounds
        slate: {
          950: '#0A0E14',  // Base (deep blue-black, not pure OLED black)
          900: '#141A23',  // Surface (cards, containers)
        },
        // === Aura Design System tokens ===
        background: {
          DEFAULT: '#0A0E14',
          surface: '#141A23',
          elevated: '#1E2530',
        },
        // High Contrast Text
        text: {
          primary: '#F2F2F7',
          secondary: '#AEAEB2',
          muted: '#8E8E93',
        },
        // Semantic Status
        status: {
          success: '#4CAF50',
          error: '#FF453A',
          warning: '#FFB300',
          info: '#008F86',
        },

        // === Legacy tokens — used by Player, SNRMixer, AudioPlayer, QuizCard ===
        // TODO: Remove after screen-by-screen design alignment sweep
        brand: {
          teal: '#008F86',
          'teal-light': '#00CFC3',
          amber: '#FFB300',
          'amber-light': '#FFD54F',
          primary: '#FF6B6B',
          secondary: '#FFD93D',
          tertiary: '#6C5CE7',
          dark: '#0F172A',
          light: '#F8FAFC',
          background: '#E0E5EC',
        },
        // Legacy utility colors (QuizCard, AudioQA, Player)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          300: '#7dd3fc',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        secondary: { 500: '#64748b' },
        success: { 500: '#22c55e' },
        error: { 500: '#ef4444' },
      },
      fontFamily: {
        sans: ['Satoshi', 'General Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      scale: {
        '98': '.98',
        '102': '1.02',
      },
      boxShadow: {
        // Aura glow effects (identity teal #008F86)
        'glow-teal': '0 0 20px rgba(0, 143, 134, 0.3)',
        'glow-amber': '0 0 20px rgba(255, 179, 0, 0.3)',
        'glow-success': '0 0 20px rgba(76, 175, 80, 0.3)',
        'glow-error': '0 0 20px rgba(255, 69, 58, 0.3)',
        // Elevation shadows
        'elevation-1': '0 2px 8px rgba(0, 143, 134, 0.1)',
        'elevation-2': '0 4px 16px rgba(0, 143, 134, 0.15)',
        'elevation-3': '0 8px 32px rgba(0, 143, 134, 0.2)',
      },
      transitionDuration: {
        '0': '0ms',
        '150': '150ms',
        '300': '300ms',
        '500': '500ms',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 143, 134, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 143, 134, 0.5)' },
        },
        'streak-flame': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'streak-flame': 'streak-flame 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
