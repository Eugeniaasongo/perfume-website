import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E0D0B",
        ivory: "#FAF7F2",
        sand: "#EFE9DF",
        stone: { DEFAULT: "#6B655C", light: "#A39C91" },
        line: "#E4DDD1",
        brand: {
          black: "#0E0D0B",
          white: "#FFFFFF",
          gold: "#B8923A",
          "gold-light": "#D4AF37",
          "gold-dark": "#8A6A23",
          red: "#C8102E",
          amber: "#2A1810",
        },
      },
      fontFamily: {
        sans: ["var(--font-jost)", "system-ui", "sans-serif"],
        display: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      letterSpacing: {
        label: "0.18em",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
        "slide-in": "slide-in 0.3s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
