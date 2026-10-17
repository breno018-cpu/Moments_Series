import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ['"Poppins"', 'system-ui', 'sans-serif'],
        body: ['"Poppins"', 'system-ui', 'sans-serif'],
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
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "hsl(var(--card-hover))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        neon: {
          DEFAULT: "hsl(var(--neon))",
          glow: "hsl(var(--neon-glow))",
          soft: "hsl(var(--neon-soft))",
        },
        warm: {
          DEFAULT: "hsl(var(--warm))",
          glow: "hsl(var(--warm-glow))",
        },
        cozy: {
          amber: "hsl(var(--cozy-amber))",
          glow: "hsl(var(--cozy-glow))",
        },
        star: {
          filled: "hsl(var(--star-filled))",
          empty: "hsl(var(--star-empty))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        },
        drama: {
          pink: "hsl(var(--drama-pink))",
          gold: "hsl(var(--drama-gold))",
          warm: "hsl(var(--drama-warm))",
        },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'neon': '0 0 25px hsl(var(--neon) / 0.25), 0 0 50px hsl(var(--neon) / 0.1)',
        'neon-strong': '0 0 40px hsl(var(--neon) / 0.4), 0 0 80px hsl(var(--neon) / 0.2)',
        'warm': '0 0 30px hsl(var(--primary) / 0.25), 0 0 60px hsl(var(--primary) / 0.1)',
        'card': '0 10px 40px hsl(0 0% 0% / 0.5)',
        'elevated': '0 25px 80px hsl(0 0% 0% / 0.6)',
        'glow': '0 0 50px hsl(var(--accent) / 0.15)',
        'deep': '0 0 100px hsl(0 0% 0% / 0.8)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          from: { opacity: "0", transform: "translateY(-16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-40px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-right": {
          from: { transform: "translateX(40px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.9)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "scale-in-bounce": {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "60%": { transform: "scale(1.03)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-neon": {
          "0%, 100%": { boxShadow: "0 0 8px hsl(200 100% 55% / 0.3)" },
          "50%": { boxShadow: "0 0 30px hsl(200 100% 55% / 0.5), 0 0 60px hsl(200 100% 55% / 0.2)" },
        },
        "pulse-warm": {
          "0%, 100%": { boxShadow: "0 0 8px hsl(0 75% 50% / 0.3)" },
          "50%": { boxShadow: "0 0 30px hsl(0 75% 50% / 0.5), 0 0 60px hsl(0 75% 50% / 0.2)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "shimmer": {
          from: { backgroundPosition: "250% 0" },
          to: { backgroundPosition: "-250% 0" },
        },
        "hero-content": {
          from: { opacity: "0", transform: "translateX(-50px) translateY(30px)" },
          to: { opacity: "1", transform: "translateX(0) translateY(0)" },
        },
        "hero-image": {
          from: { opacity: "0", transform: "scale(1.1)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "badge-pop": {
          "0%": { transform: "scale(0) rotate(-10deg)", opacity: "0" },
          "60%": { transform: "scale(1.15) rotate(2deg)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "reveal": {
          from: { clipPath: "inset(0 100% 0 0)" },
          to: { clipPath: "inset(0 0 0 0)" },
        },
        "typewriter": {
          from: { width: "0" },
          to: { width: "100%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in-up": "fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in-down": "fade-in-down 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in": "slide-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in-right": "slide-in-right 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in-bounce": "scale-in-bounce 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-neon": "pulse-neon 3s ease-in-out infinite",
        "pulse-warm": "pulse-warm 3s ease-in-out infinite",
        "float": "float 5s ease-in-out infinite",
        "glow": "glow 2.5s ease-in-out infinite",
        "shimmer": "shimmer 2.5s ease-in-out infinite",
        "hero-content": "hero-content 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "hero-image": "hero-image 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "badge-pop": "badge-pop 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "reveal": "reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
