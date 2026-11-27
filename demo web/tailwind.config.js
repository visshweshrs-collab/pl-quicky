/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pl: {
          // Existing token names are kept so components need no changes;
          // only their values move to the new midnight / cyan / magenta palette.
          dark: '#0B051D',        // Primary background
          navy: '#1E1142',        // Tertiary background (inputs / hover)
          card: '#140B2E',        // Secondary background (cards)
          cardHover: '#1E1142',   // Card hover state
          border: '#2D1B5E',      // Borders and dividers
          borderLight: '#3F2A80', // Slightly lighter border
          borderPink: '#00A8E8',  // Accent border (now cyan)
          purple: '#241452',      // Deep violet surface (chips / active states)
          purpleLight: '#34206F', // Lighter violet surface
          purpleGlow: '#7B52C7',  // Violet
          pink: '#00A8E8',        // Primary accent (now Primary Cyan)
          pinkLight: '#19B8F5',   // Accent highlight (now Cyan Hover)
          lavender: '#94A3B8',    // Secondary text
          muted: '#64748B',       // Muted text
          white: '#FFFFFF',
          green: '#00A8E8',       // Redirected to primary accent
          cyan: '#19B8F5',        // Accent highlight

          // New palette names (additions only)
          cyanHover: '#19B8F5',
          violet: '#7B52C7',
          violetLight: '#A78BFA', // Lighter violet tint for text on dark surfaces
          magenta: '#E61C78',
          text: '#F8FAFC',        // Primary text

          gray: {
            100: '#F8FAFC',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#2D1B5E',
            800: '#1E1142',
            900: '#140B2E'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif']
      },
      boxShadow: {
        'glow-pink': '0 0 25px -4px rgba(0, 168, 232, 0.45)',
        'glow-purple': '0 0 30px -5px rgba(123, 82, 199, 0.5)',
        'glow-subtle': '0 0 15px -3px rgba(0, 168, 232, 0.25)',
        'card': '0 8px 32px rgba(3, 1, 12, 0.6)',
        'card-hover': '0 12px 40px rgba(3, 1, 12, 0.8), 0 0 20px -3px rgba(0, 168, 232, 0.25)'
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, rgba(0, 168, 232, 0.14) 0%, #140B2E 42%, #140B2E 60%, rgba(230, 28, 120, 0.13) 100%)',
        'pink-gradient': 'linear-gradient(135deg, #00A8E8 0%, #5B6EE1 45%, #A63A9E 75%, #E61C78 100%)',
        'match-gradient': 'linear-gradient(135deg, rgba(0, 168, 232, 0.08) 0%, rgba(20, 11, 46, 0.95) 55%)',
        'card-gradient': 'linear-gradient(145deg, rgba(30, 17, 66, 0.9) 0%, rgba(20, 11, 46, 0.95) 100%)',
        'accent-pink': 'linear-gradient(90deg, #00A8E8 0%, #5B6EE1 45%, #A63A9E 75%, #E61C78 100%)',

        // Brand gradient (additions)
        'brand-gradient': 'linear-gradient(135deg, #00A8E8 0%, #5B6EE1 45%, #A63A9E 75%, #E61C78 100%)',
        'brand-gradient-x': 'linear-gradient(90deg, #00A8E8 0%, #5B6EE1 45%, #A63A9E 75%, #E61C78 100%)'
      }
    },
  },
  plugins: [],
}
