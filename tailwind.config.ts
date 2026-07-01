import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0e14",
          panel: "#111826",
          card: "#161f2e",
        },
        accent: {
          DEFAULT: "#3ddc97",
          cyan: "#38bdf8",
        },
        status: {
          safe: "#3ddc97",
          tight: "#eab308",
          warning: "#f97316",
          incompatible: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["'Noto Sans TC'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
