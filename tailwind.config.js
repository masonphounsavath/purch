/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'unc-blue':  '#4B9CD3',
        'unc-navy':  '#13294B',
        'accent':    '#D97A3A',
        // Route v2 redesign palette
        brand: {
          navy:     '#051E37',
          'navy-2': '#1C3A5C',
          sky:      '#55A7FE',
          'sky-ink':'#2F6FB8',
          mist:     '#EEF2F7',
          map:      '#E6ECF2',
          muted:    '#4B5B6E',
          subtle:   '#A9B8CA',
          line:     '#DCE3EC',
        },
      },
      fontFamily: {
        outfit:  ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        figtree: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        sans:    ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['Geist Mono', 'ui-monospace', 'monospace'],
        label:   ['Syne', 'ui-sans-serif', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
