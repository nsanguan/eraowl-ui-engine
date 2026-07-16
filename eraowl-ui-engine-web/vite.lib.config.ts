import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: "src/render-engine",
      include: [
        "src/render-engine/**",
        "src/store/useRenderStore.ts",
        "src/themes/index.ts",
      ],
    }),
    // Copy static theme assets (eut-runtime.css + Style presets) to dist
    viteStaticCopy({
      targets: [
        {
          src: "src/themes/eut/styles/*",
          dest: "themes/eut/styles",
        },
        {
          src: "src/styles/eut-runtime.css",
          dest: "themes/eut",
        },
      ],
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/render-engine/index.ts"),
      name: "EraOwlUIEngine",
      formats: ["es", "umd"],
      fileName: (fmt) => `eraowl-ui-engine.${fmt}.js`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "zustand",
        "@tanstack/react-query",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          zustand: "zustand",
        },
      },
    },
    sourcemap: true,
    emptyOutDir: false, // Don't delete dist/designer built earlier
    outDir: "dist/eraowl-ui-engine",
  },
});
