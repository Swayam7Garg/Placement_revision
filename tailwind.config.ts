import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      colors: {
        bg: {
          950: "#070B14",
          900: "#0B1422",
          800: "#111F33"
        },
        ink: {
          50: "#EAF2FF",
          100: "#D7E6FF",
          300: "#8FB7FF",
          400: "#6AA0FF",
          500: "#23D3C3"
        },
        card: "#0F1B2D",
        border: "#1B2A44"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(35, 211, 195, 0.18), 0 14px 32px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
} satisfies Config;

