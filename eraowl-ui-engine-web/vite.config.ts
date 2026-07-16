import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

const MODE = process.env.BUILD_MODE ?? "designer";

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  build:
    MODE === "designer"
      ? {
          outDir: "dist/designer",
          sourcemap: true,
        }
      : undefined, // lib mode handled by vite.lib.config.ts
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
}));
