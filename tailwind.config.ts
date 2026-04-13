import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#070f18",
          900: "#0d1b2a",
          800: "#0f2337",
          700: "#142840",
          600: "#1e3448",
          500: "#2a4560",
        },
        brand: {
          purple: "#5B35C9",
          "purple-hover": "#6d4edb",
          "purple-light": "#7c5ce8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
