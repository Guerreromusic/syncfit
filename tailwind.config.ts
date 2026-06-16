import type { Config } from "tailwindcss";

/**
 * SyncFit by Synclat — design system tokens.
 * Visual direction: dark mode, near-black background, deep purple accents,
 * lime green CTAs, white text, soft gray secondary text, rounded premium cards.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Near-black surfaces
        ink: {
          950: "#07060B", // page background
          900: "#0C0A12", // base
          850: "#110E1A",
          800: "#16121F", // card background
          700: "#1E1930", // elevated card / borders
          600: "#2A2440",
        },
        // Deep purple accent
        purple: {
          DEFAULT: "#8B5CF6",
          50: "#F2EBFF",
          100: "#E4D7FF",
          200: "#C9AEFF",
          300: "#A983FF",
          400: "#8B5CF6",
          500: "#7C3AED",
          600: "#6D28D9",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#2E1065",
        },
        // Lime green CTA
        lime: {
          DEFAULT: "#BEF264",
          300: "#D9F99D",
          400: "#BEF264",
          500: "#A3E635",
          600: "#84CC16",
        },
        // Text
        soft: "#9CA3AF", // soft gray secondary text
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 30px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(139,92,246,0.25), 0 12px 40px -12px rgba(139,92,246,0.35)",
        lime: "0 8px 24px -8px rgba(190,242,100,0.4)",
      },
      backgroundImage: {
        // Very subtle, flat canvas tint (Claude-like calm) — barely-there glow.
        "purple-glow":
          "radial-gradient(1100px 520px at 18% -12%, rgba(124,58,237,0.06), transparent 60%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
