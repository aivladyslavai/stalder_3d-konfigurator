/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        stalder: {
          ink: '#191923',
          deep: '#0e0e14',
          paper: '#fefefe',
          taupe: '#96917E',
          'taupe-dark': '#7c7765',
          muted: '#5e5e5e',
          line: '#eaeaea',
        },
      },
      fontFamily: {
        sans: ['Mulish', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      letterSpacing: {
        brand: '0.025em',
        kicker: '0.18em',
      },
    },
  },
  plugins: [],
}
