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
        cream: {
          50: '#FDFDFB',
          100: '#FBF9F5',
          200: '#F5F2EB',
          300: '#EBE6DC',
          400: '#DFD8CA',
          500: '#CEC4B2',
          card: '#FFFFFF',
          soft: '#F6F3ED',
        },
        bordeaux: {
          50: '#FDF3F4',
          100: '#FCE6E8',
          200: '#F8CBD1',
          300: '#F2A3AE',
          400: '#E66F81',
          500: '#D6465C',
          600: '#BA2A41',
          700: '#8A222B', // Primary Brand Accent
          800: '#731C24',
          900: '#5E1A21',
          950: '#360A0F',
        },
        charcoal: {
          DEFAULT: '#1E1B18',
          muted: '#78726D',
          light: '#A39E98',
          surface: '#2C2825',
        }
      },
      fontFamily: {
        sans: ['Satoshi', 'General Sans', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Cabinet Grotesk', 'General Sans', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['Plus Jakarta Sans', 'monospace'],
      },
      boxShadow: {
        'soft-sm': '0 2px 8px -1px rgba(0, 0, 0, 0.03), 0 1px 4px -1px rgba(0, 0, 0, 0.02)',
        'soft': '0 10px 30px -4px rgba(30, 27, 24, 0.04), 0 4px 12px -2px rgba(30, 27, 24, 0.02)',
        'soft-lg': '0 20px 40px -6px rgba(30, 27, 24, 0.06), 0 8px 16px -4px rgba(30, 27, 24, 0.03)',
        'bordeaux': '0 10px 25px -4px rgba(138, 34, 43, 0.28), 0 4px 10px -2px rgba(138, 34, 43, 0.15)',
        'ticket': '0 18px 45px -8px rgba(30, 27, 24, 0.08), 0 6px 18px -4px rgba(30, 27, 24, 0.04)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'ticker': 'ticker 40s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      }
    },
  },
  plugins: [],
}
