import { Config } from "tailwindcss";
import * as solidUi from "./ui.preset";

export default {
  darkMode: ["class", '[data-kb-theme="dark"]'],
  content: ["./src/**/*.{html,js,jsx,md,mdx,ts,tsx}"],
  presets: [solidUi],
  theme: {
    extend: {
      fontFamily: {
        sans: "var(--font-geist)",
        display: ["var(--font-geist)", { fontFeatureSettings: '"ss01"' }],
        mono: "var(--font-geist-mono)"
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--kb-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--kb-accordion-content-height)" },
          to: { height: "0" }
        },
        "shiny-text": {
          "0%, 90%, 100%": {
            backgroundPosition: "calc(-100% - var(--shiny-width)) 0"
          },
          "30%, 60%": {
            backgroundPosition: "calc(100% + var(--shiny-width)) 0"
          }
        }
      },
      animation: {
        "shiny-text": "shiny-text 8s infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out"
      }
    }
  }
} satisfies Config;
