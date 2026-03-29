/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        nofly: "#DC2626",
        restricted: "#F59E0B",
        caution: "#FB923C",
        clearfly: "#16A34A",
        primary: "#1a1a2e",
        secondary: "#16213e",
        accent: "#0f3460",
      },
    },
  },
  plugins: [],
};
