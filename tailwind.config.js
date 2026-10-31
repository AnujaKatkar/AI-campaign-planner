/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        blush: '#FCEBE3',
        ink: '#2B1D16',
        muted: '#85695A',
        line: '#F0DACC',
        rose: { DEFAULT: '#E23E57', deep: '#A82A3F' },
        honey: '#F2B33D',
        teal: '#13797A',
        sage: '#3E8E5E',
        espresso: '#1A1110',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['Figtree', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        script: ['Yellowtail', 'cursive'],
      },
      borderRadius: {
        card: '18px',
      },
      boxShadow: {
        sticker: '3px 3px 0 #2B1D16',
      },
    },
  },
  plugins: [],
};
