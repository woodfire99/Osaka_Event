/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        jp: ['"Noto Sans JP"', 'sans-serif'],
        en: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

