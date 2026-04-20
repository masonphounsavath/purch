/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'unc-blue':  '#4B9CD3',
        'unc-navy':  '#13294B',
        'accent':    '#D97A3A',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans:    ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['Geist Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
