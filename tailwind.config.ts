import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: "#0F1013",
          900: "#15171B",
          800: "#1D2025",
          700: "#2A2E35",
          600: "#3C424B",
        },
        paper: "#E9E5DA",
        signal: {
          amber: "#E0A23D",
          green: "#6FCF97",
          red: "#E0685B",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};

export default config;
