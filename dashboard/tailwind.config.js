/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        factory: {
          bg: '#0f172a',
          panel: '#1e293b',
          accent: '#38bdf8',
          danger: '#f87171',
          ok: '#4ade80'
        }
      }
    }
  },
  plugins: []
};
