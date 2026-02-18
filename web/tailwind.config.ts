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
        sidebar: "#1d252d",
        "sidebar-text": "#98a5af",
        "sidebar-hover": "rgba(255,255,255,0.1)",
      },
      fontFamily: {
        sans: ["Avenir", "Helvetica", "Arial", "Verdana", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
