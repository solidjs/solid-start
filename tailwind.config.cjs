/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./docs/**/*.{js,jsx,ts,tsx}", "./root.docs.tsx"],

  theme: {
    extend: {}
  },
  plugins: [require("@tailwindcss/typography")]
};
