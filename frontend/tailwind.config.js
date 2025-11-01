/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
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
          950: '#082f49',
        },
      },
      animation: {
        aurora: "aurora 30s linear infinite",
      },
      keyframes: {
        aurora: {
          "0%": {
            transform: "rotate(0deg) translateY(0px)",
          },
          "50%": {
            transform: "rotate(180deg) translateY(-50px)",
          },
          "100%": {
            transform: "rotate(360deg) translateY(0px)",
          },
        },
      },
    },
  },
  plugins: [],
}
