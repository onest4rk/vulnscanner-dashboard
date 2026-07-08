import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#080b12",
          50: "#0c101c",
          100: "#101624",
          200: "#151d2d",
        },
        accent: {
          DEFAULT: "#3b82f6",
          hover: "#60a5fa",
          subtle: "rgba(59, 130, 246, 0.06)",
          glow: "rgba(59, 130, 246, 0.1)",
        },
        navy: {
          900: "#04060a",
          800: "#080b12",
          700: "#0c101c",
          600: "#101624",
          500: "#151d2d",
          400: "#1c2540",
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(0, 0, 0, 0.5), 0 1px 1px -1px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
