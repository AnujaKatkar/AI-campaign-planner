/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Themed tokens (light + dark live in index.css)
        cream: token('bg'),
        surface: token('surface'),
        blush: token('surface-2'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
        rose: { DEFAULT: token('rose'), deep: token('rose-deep') },
        'on-rose': token('on-rose'),
        honey: token('honey'),
        teal: token('teal'),
        sage: token('sage'),
        // Fixed colors that never flip with the theme
        espresso: '#1A1110',
        paper: '#FFF8F0',
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
        sticker: '3px 3px 0 rgb(var(--ink))',
        lift: '0 24px 60px -24px rgba(43, 29, 22, 0.35)',
      },
    },
  },
  plugins: [],
};
