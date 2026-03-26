import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["var(--font-poppins)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        navy: {
          DEFAULT: "#1a1c48",
          light: "#2d3072",
        },
        brand: {
          green: "#3dd63a",
          teal: "#2bbfa0",
          blue: "#29b4f6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
