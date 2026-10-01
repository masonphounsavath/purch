/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Route v2 palette
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
        sans:    ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
