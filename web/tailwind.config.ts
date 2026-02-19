import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#0092cc",
        "primary-dark": "#007aa3",
        secondary: "#0092cc",
        "onehope-black": "#3C464A",
        "onehope-gray": "#f1f3f4",
        "onehope-info": "#eef1f2",
        sidebar: "#0092cc",
        "sidebar-text": "rgba(255,255,255,0.9)",
        "sidebar-hover": "rgba(255,255,255,0.15)",
      },
      fontFamily: {
        sans: ["Avenir", "Helvetica", "Arial", "Verdana", "sans-serif"],
      },
      keyframes: {
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slide-up": "slideUp 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
