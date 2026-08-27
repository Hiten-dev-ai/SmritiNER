/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tea: {
          50: '#f2f9f4',
          100: '#e1f2e6',
          200: '#c3e5cd',
          300: '#94d1a6',
          400: '#5eb57a',
          500: '#389957',
          600: '#2a7c44',
          700: '#236338',
          800: '#1e4f2e',
          900: '#1a4128',
          950: '#0a2414',
        },
        brahma: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        assamGold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        gamusaRed: {
          500: '#e11d48',
          600: '#be123c',
          700: '#9f1239',
        }
      },
      fontSize: {
        'elderly-xs': ['1.125rem', { lineHeight: '1.75rem' }],
        'elderly-sm': ['1.25rem', { lineHeight: '1.875rem' }],
        'elderly-base': ['1.5rem', { lineHeight: '2.125rem' }],
        'elderly-lg': ['1.875rem', { lineHeight: '2.375rem' }],
        'elderly-xl': ['2.25rem', { lineHeight: '2.75rem' }],
        'elderly-2xl': ['3rem', { lineHeight: '1.2' }],
      }
    },
  },
  plugins: [],
}
