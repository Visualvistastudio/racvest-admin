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
        brand: {
          green: "#014D21",
          "green-light": "#026B2E",
          "green-dark": "#013A19",
          orange: "#DC851F",
          "orange-light": "#E69A3F",
        },
        sidebar: {
          bg: "#0A1628",
          hover: "#132038",
          active: "#014D21",
          text: "#94A3B8",
          "text-active": "#FFFFFF",
        },
        surface: {
          primary: "#FFFFFF",
          secondary: "#F9FAFB",
          tertiary: "#F3F4F6",
        },
        status: {
          success: "#10B981",
          "success-bg": "#ECFDF5",
          warning: "#F59E0B",
          "warning-bg": "#FFFBEB",
          danger: "#DC2626",
          "danger-bg": "#FEF2F2",
          info: "#3B82F6",
          "info-bg": "#EFF6FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
