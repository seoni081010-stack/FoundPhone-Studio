import { localIconPlugin } from "./scripts/local-icon-plugin";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(({ command }) => ({
  base: "./",
  optimizeDeps: { entries: ["index.html"] },
  build: { rollupOptions: { output: { manualChunks(id) {
    if (id.endsWith("/stories/q-expanded.json")) return "q-expanded-story";
    if (id.endsWith("/stories/jcode-expanded.json")) return "jacob-expanded-story";
  } } } },
  plugins: [
    localIconPlugin(command),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "捡手机",
        short_name: "捡手机",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [{ src: "icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      workbox: {
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,svg,json,txt,png,jpg}"],
        maximumFileSizeToCacheInBytes: 4000000,
      },
    }),
  ],
}));
