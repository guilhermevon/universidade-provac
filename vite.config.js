import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Use a função exportada
      protocolImports: true,
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 4000,
    strictPort: true,
    open: true,
    hmr: { overlay: true },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    minify: "esbuild",
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  resolve: {
    alias: {
      crypto: "crypto-browserify", // Use polyfill para "crypto"
    },
  },
});
