import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  envDir: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    rollupOptions: {
      input: {
        main: "client/index.html",
      },
    },
    emptyOutDir: true,
    // Copiar archivos específicos a dist
    copyPublicDir: true,
  },
  // Copiar archivos adicionales después del build
  publicDir: "public",
  server: {
    // proxy: {
    //   '/api': 'http://localhost:5001'
    // }
  },
});
