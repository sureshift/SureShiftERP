import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          charts: ["recharts"],
          icons:  ["lucide-react"],
          pb:     ["pocketbase"],
        },
      },
    },
  },
  server: {
    port: 5173,
    // Dev proxy: forward API calls to local PocketBase
    proxy: {
      "/api": { target: "http://localhost:8091", changeOrigin: true },
      "/_":   { target: "http://localhost:8091", changeOrigin: true },
    },
  },
});
