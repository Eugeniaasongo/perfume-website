import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#000000",
          white: "#FFFFFF",
          gold: "#B8923A",
          "gold-light": "#D4AF37",
          "gold-dark": "#8A6A23",
          red: "#C8102E",
          amber: "#2A1810",
          grey: "#666666",
          "grey-light": "#F5F5F5",
        },
      },
      fontFamily: {
        sans: ["var(--font-jost)", "Montserrat", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
      },
    },
  },
  plugins: [],
};
export default config;
