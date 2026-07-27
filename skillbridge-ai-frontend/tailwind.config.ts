import type { Config } from "tailwindcss";

/**
 * SkillBridge AI design tokens
 * ------------------------------------------------------------------
 * Color:
 *   bridge   #2451B8  -> primary, trust / professional (LinkedIn-adjacent but cooler, less generic blue)
 *   signal   #F5A623  -> accent, action / urgency (gig energy, countdown rings, CTAs)
 *   deep     #0B1120  -> near-black navy, dark surface base
 *   mist     #F6F7FB  -> light surface base (cool neutral, not warm cream)
 *   emerald  #16A34A  -> success / earnings / online status
 *   coral    #E5484D  -> danger / decline / offline
 * Type:
 *   display  "Space Grotesk" - headings, stat numbers, brand voice
 *   body     "Inter"          - UI copy, forms, tables
 *   mono     "IBM Plex Mono"  - timers, IDs, currency ticks
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        bridge: {
          50: "#EEF3FC", 100: "#DCE7F9", 200: "#B4C9F1", 300: "#7C9EE5",
          400: "#4A72D2", 500: "#2451B8", 600: "#1D419A", 700: "#17337B",
          800: "#11265C", 900: "#0B1120",
        },
        signal: {
          50: "#FEF7EA", 100: "#FDECC8", 200: "#FAD68C", 300: "#F7BE55",
          400: "#F5A623", 500: "#DF8F0F", 600: "#B8730C", 700: "#8C5709",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 6px)",
        "2xl": "calc(var(--radius) + 14px)",
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(11, 17, 32, 0.10)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
        glow: "0 0 0 4px rgba(245, 166, 35, 0.15)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "slide-up": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        "pulse-ring": { "0%": { boxShadow: "0 0 0 0 rgba(245,166,35,0.45)" }, "70%": { boxShadow: "0 0 0 14px rgba(245,166,35,0)" }, "100%": { boxShadow: "0 0 0 0 rgba(245,166,35,0)" } },
        shimmer: { "0%": { backgroundPosition: "-700px 0" }, "100%": { backgroundPosition: "700px 0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
