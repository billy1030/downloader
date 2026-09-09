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
        dark: {
          950: '#07090e',
          900: '#0c1017',
          850: '#111722',
          800: '#161f2e',
          700: '#233047',
        },
        brand: {
          500: '#6366f1',
          600: '#4f46e5',
          glow: '#818cf8',
        }
      }
    },
  },
  plugins: [],
}
