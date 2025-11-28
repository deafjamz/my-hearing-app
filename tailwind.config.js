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
        // "Vitality" Palette (Neumorphic Design System)
        brand: {
          primary: '#FF6B6B',   // Coral: Energy, Reward (Accent)
          secondary: '#FFD93D', // Sunshine: Optimism (Accent)
          tertiary: '#6C5CE7',  // Violet: Mastery (Accent)
          dark: '#0F172A',      // Slate: Readability (Primary Text in Light, Background in Dark)
          light: '#F8FAFC',     // Warm White: Highlights, readable on dark (Primary Text in Dark)
          background: '#E0E5EC', // Neumorphic Base Background
        },
        // Legacy/Utility colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        secondary: {
          500: '#64748b',
        },
        success: {
          500: '#22c55e',
        },
        error: {
          500: '#ef4444',
        }
      },
      boxShadow: {
        'neumo-convex': '-6px -6px 16px rgba(255, 255, 255, 0.8), 6px 6px 16px rgba(163, 177, 198, 0.6)',
        'neumo-concave': 'inset 6px 6px 16px rgba(163, 177, 198, 0.6), inset -6px -6px 16px rgba(255, 255, 255, 0.8)',
        'neumo-flat': '6px 6px 16px rgba(163, 177, 198, 0.6)', // For subtle elevation without highlight
        // Dark Mode Shadows
        'dark-neumo-convex': '-6px -6px 16px rgba(30, 41, 59, 0.8), 6px 6px 16px rgba(0, 0, 0, 0.6)',
        'dark-neumo-concave': 'inset 6px 6px 16px rgba(0, 0, 0, 0.6), inset -6px -6px 16px rgba(30, 41, 59, 0.8)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}