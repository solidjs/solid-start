/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./docs/**/*.{js,jsx,ts,tsx}", "./docs.root.tsx", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: require("tailwindcss/colors")
    }
  },
  plugins: [require("@tailwindcss/typography")]
};
