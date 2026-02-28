/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Dark-blue palette (original theme) ──────────────────────────
        // Surfaces
        "d-base":    "#080D1A",   // page background
        "d-surface": "#0F1629",   // card background
        "d-raised":  "#162038",   // elevated card
        "d-border":  "#1E2D4A",   // subtle divider
        "d-border2": "#253555",   // stronger border
        // Text
        "d-text":    "#E8EDF5",   // primary
        "d-text2":   "#7D90B0",   // secondary
        "d-text3":   "#3D5070",   // muted / disabled
        // Brand: indigo
        brand: {
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        // Violet accent
        violet: {
          400: "#C084FC",
          500: "#A855F7",
        },
        // Gold – bingo lines
        gold: {
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
        },
        // Status
        emerald: {
          400: "#34D399",
          500: "#10B981",
        },
        rose: {
          400: "#FB7185",
          500: "#F43F5E",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      backgroundImage: {
        "page-gradient": "radial-gradient(ellipse 80% 60% at 50% 0%, #1C2A5E 0%, #080D1A 55%)",
        "brand-gradient": "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)",
        "gold-gradient":  "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
      },
      boxShadow: {
        "glass":      "0 2px 16px rgba(0,0,0,0.35)",
        "brand-glow": "0 0 16px rgba(99,102,241,0.35)",
        "gold-glow":  "0 0 14px rgba(251,191,36,0.4)",
        "cell":       "0 1px 4px rgba(0,0,0,0.4)",
      },
      animation: {
        "fade-in":  "fadeIn 0.2s ease both",
        "slide-up": "slideUp 0.25s ease both",
        "pop":      "pop 0.2s ease both",
        "pulse-s":  "pulseS 2.5s ease-in-out infinite",
        "spin-s":   "spin 0.7s linear infinite",
        "confetti": "confettiFall 2s ease-in forwards",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%":   { transform: "scale(0.9)",  opacity: "0" },
          "60%":  { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)",    opacity: "1" },
        },
        pulseS: {
          "0%, 100%": { opacity: "0.6" },
          "50%":      { opacity: "1" },
        },
        confettiFall: {
          "0%":   { transform: "translateY(-16px) rotate(0deg)",    opacity: "1" },
          "80%":  { opacity: "0.9" },
          "100%": { transform: "translateY(100vh) rotate(500deg)",  opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
