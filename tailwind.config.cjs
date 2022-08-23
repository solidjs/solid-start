/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./docs/**/*.{js,jsx,ts,tsx}", "./root.docs.tsx", "./components/**/*.{js,jsx,ts,tsx}"],

  theme: {
    extend: {}
  },
  plugins: [require("@tailwindcss/typography")]
};
