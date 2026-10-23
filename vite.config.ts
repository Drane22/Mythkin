import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile({ useRecommendedBuildConfig: false })],
  base: './',
  build: {
    // Paintings load individually. Embedding the entire roster in index.html
    // would make every summon download tens of megabytes before it can appear.
    assetsInlineLimit: (path) => !/\/painted\/assets\//.test(path.replace(/\\/g, '/')),
    // Inlined JS resolves import.meta.url from index.html, so keep external
    // artwork beside that file rather than beside a removed assets/*.js chunk.
    assetsDir: '',
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
