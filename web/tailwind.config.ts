import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        // Receipt-paper cream — used sparingly as the warm counterpoint
        // to the otherwise cool-neutral dark palette.
        paper: {
          50: "#faf3e3",
          100: "#f5e9d3",
          200: "#e8d6b3",
        },
      },
      keyframes: {
        "caret-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-trail": {
          "0%": { offsetDistance: "0%", opacity: "0" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { offsetDistance: "100%", opacity: "0" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.1s steps(1, end) infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(.2,.8,.2,1) both",
        "pulse-trail": "pulse-trail 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
