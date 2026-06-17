/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        steel: {
          50: '#E8EDF5',
          100: '#C5D0E3',
          200: '#8899B4',
          300: '#5A6F8E',
          400: '#1E3A5F',
          500: '#1B3A5C',
          600: '#162240',
          700: '#111D35',
          800: '#0B1426',
          900: '#060D1A',
        },
        amber: {
          DEFAULT: '#F59E0B',
          dim: 'rgba(245, 158, 11, 0.15)',
        },
        risk: {
          critical: '#EF4444',
          high: '#F97316',
          medium: '#EAB308',
          low: '#22C55E',
        },
      },
    },
  },
  plugins: [],
};
