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
        primary: "#D0FF00",
        background: "#121212",
        surface: "#1E1E1E",
        border: "#2A2A2A",
        text: {
          primary: "#FFFFFF",
          secondary: "#888888",
        },
      },
      fontFamily: {
        lexend: ["var(--font-lexend)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
