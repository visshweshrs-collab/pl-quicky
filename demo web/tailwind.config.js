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
          dark: '#110616',        // Very dark purple / almost black background
          navy: '#17071F',        // Secondary deep plum surface
          card: '#1C0825',        // Dark plum/purple card background
          cardHover: '#250B30',   // Card hover state
          border: '#3D0F45',      // Thin plum/magenta border
          borderLight: '#591663', // Slightly lighter purple border
          borderPink: '#FA007B',  // Vibrant magenta border
          purple: '#4A0B4F',      // Deep purple
          purpleLight: '#6B145F', // Rich purple accent
          purpleGlow: '#9E1C8C',  // Violet glow
          pink: '#FA007B',        // Bright hot pink / magenta primary
          pinkLight: '#FF2B9A',   // Light magenta highlight
          lavender: '#C8B6D6',    // Light lavender secondary text
          muted: '#8D769E',       // Muted purple/gray
          white: '#FFFFFF',
          green: '#FA007B',       // Redirected to magenta for primary badges
          cyan: '#FF2B9A',        // Redirected to hot pink for accents
          gray: {
            100: '#F5F0F8',
            200: '#E6DCED',
            300: '#C8B6D6',
            400: '#8D769E',
            500: '#6E587E',
            600: '#523E61',
            700: '#3D2A4B',
            800: '#281734',
            900: '#1A0B24'
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif']
      },
      boxShadow: {
        'glow-pink': '0 0 25px -4px rgba(250, 0, 123, 0.45)',
        'glow-purple': '0 0 30px -5px rgba(107, 20, 95, 0.5)',
        'glow-subtle': '0 0 15px -3px rgba(250, 0, 123, 0.25)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px -3px rgba(250, 0, 123, 0.25)'
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #4A0B4F 0%, #34073A 40%, #1D0522 100%)',
        'pink-gradient': 'linear-gradient(90deg, #FA007B 0%, #D8006E 100%)',
        'match-gradient': 'linear-gradient(135deg, rgba(74, 11, 79, 0.7) 0%, rgba(28, 8, 37, 0.9) 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(35, 9, 44, 0.9) 0%, rgba(22, 6, 29, 0.95) 100%)',
        'accent-pink': 'linear-gradient(90deg, #FA007B 0%, #FF2B9A 100%)'
      }
    },
  },
  plugins: [],
}
