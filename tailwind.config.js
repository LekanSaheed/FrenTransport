/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "border-stroke": "#E3E4E6",
        primary: "#6d46cc",
        secondary: "#06D7A0",
        tertiary: "#CEFAD7",
        black: "#2A2A2A",
      },
      backgroundImage: {
        city: "url('/city.png')",
      },
    },
  },
  plugins: [],
};
