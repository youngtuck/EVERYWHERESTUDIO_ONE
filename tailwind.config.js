/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        afacad: ["'Afacad Flux'", "sans-serif"],
      },
      colors: {
        navy: "#0D1B2A",
        "rich-navy": "#1B263B",
        cornflower: "#4A90D9",
        gold: "#F5C642",
        teal: "#188FA7",
        coral: "#E8B4A0",
        "off-white": "#F7F9FC",
        "mid-gray": "#64748B",
        border: "#E2E8F0",
      },
    },
  },
  plugins: [],
};
