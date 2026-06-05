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
        // Surface/line/text are themed via CSS vars (globals.css): dark default, light cream on [data-theme="blue"].
        bg: {
          base: "rgb(var(--bg-base) / <alpha-value>)",
          elev: "rgb(var(--bg-elev) / <alpha-value>)",
          card: "rgb(var(--bg-card) / <alpha-value>)",
          hover: "rgb(var(--bg-hover) / <alpha-value>)",
        },
        line: {
          subtle: "rgb(var(--line-subtle) / <alpha-value>)",
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          bright: "rgb(var(--line-bright) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
        },
        accent: {
          // Themed via CSS vars (see globals.css): green default, Base blue on [data-theme="blue"].
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          dim: "rgb(var(--accent-dim) / <alpha-value>)",
          glow: "rgb(var(--accent-glow) / <alpha-value>)",
          // Readable text/icon color to sit ON an accent background (dark on lime, light on blue).
          ink: "rgb(var(--accent-ink) / <alpha-value>)",
        },
        live: "rgb(var(--live) / <alpha-value>)",
        gold: "#E8B547",
        rarity: {
          common: "#9CA3AF",
          rare: "#5B9CFF",
          epic: "#B47CFF",
          legendary: "#E8B547",
          mythic: "#FF5C9C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        "label": "0.18em",
        "label-tight": "0.12em",
      },
      boxShadow: {
        soft: "var(--shadow-sm)",
        glass: "var(--shadow-md)",
        lift: "var(--shadow-lg)",
      },
      animation: {
        "shimmer": "shimmer 2.5s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
