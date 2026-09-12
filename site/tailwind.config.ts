import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#0c0d10",
        surface: {
          DEFAULT: "#12151c",
          subtle: "#181d26",
          elevated: "#1f2532",
          border: "#252d3d",
          borderHover: "#3d485e",
        },
        paper: "#f4f2ec",
        ink: "#0c0d10",
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        action: {
          act: "#10B981",
          hold: "#F59E0B",
          reject: "#EF4444",
          witness: "#8B5CF6",
        }
      },
      fontFamily: {
        display: ["var(--font-display)", "Cabinet Grotesk", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "Consolas", "monospace"],
        sans: ["var(--font-body)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
