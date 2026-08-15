/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0C2D6B', dark: '#081F4D' },
        cream: '#FAF9F4',
        gold: '#B08D3F'
      },
      fontFamily: {
        serif: ['Georgia', '"Times New Roman"', 'serif']
      }
    }
  },
  plugins: []
};
