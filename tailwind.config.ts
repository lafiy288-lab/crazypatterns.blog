import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const withVar = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: withVar("--color-primary"), dark: withVar("--color-primary-dark") },
        accent: { DEFAULT: withVar("--color-accent"), strong: withVar("--color-accent-strong"), ink: withVar("--color-accent-ink") },
        cream: withVar("--color-bg"),
        ink: withVar("--color-text"),
        card: withVar("--color-card"),
        line: withVar("--color-line"),
        muted: withVar("--color-muted"),
      },
      fontFamily: {
        heading: ["var(--font-poppins)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "12px", "2xl": "16px" },
      boxShadow: {
        soft: "0 1px 2px rgb(15 23 42 / 0.04), 0 4px 16px rgb(15 23 42 / 0.06)",
        lift: "0 6px 12px rgb(15 23 42 / 0.06), 0 16px 40px rgb(15 23 42 / 0.10)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: { shimmer: "shimmer 1.5s infinite" },
    },
  },
  plugins: [typography],
} satisfies Config;
