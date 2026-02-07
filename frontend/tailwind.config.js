/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brutal: {
          orange: '#FF6B00',
          black: '#1A1A1A',
          white: '#FFFFFF',
          gray: '#E5E5E5',
          dark: '#2D2D2D'
        }
      },
      fontFamily: {
        brutal: ['Space Mono', 'monospace'],
        display: ['Bebas Neue', 'sans-serif']
      },
      boxShadow: {
        brutal: '4px 4px 0px 0px #1A1A1A',
        'brutal-lg': '6px 6px 0px 0px #1A1A1A',
        'brutal-orange': '4px 4px 0px 0px #FF6B00'
      },
      borderWidth: {
        '3': '3px',
        '4': '4px'
      }
    },
  },
  plugins: [],
}
