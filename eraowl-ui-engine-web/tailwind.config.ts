import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        eut: {
          bg: "var(--eut-color-bg)",
          fg: "var(--eut-color-fg)",
          accent: "var(--eut-color-accent)",
          muted: "var(--eut-color-muted)",
          success: "var(--eut-color-success)",
          danger: "var(--eut-color-danger)",
        },
      },
      borderRadius: {
        sm: "var(--eut-radius-sm)",
        md: "var(--eut-radius-md)",
        lg: "var(--eut-radius-lg)",
      },
      fontFamily: {
        body: ["var(--eut-font-family)", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
