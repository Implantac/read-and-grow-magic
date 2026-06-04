import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          'vendor-ui': ['lucide-react', 'recharts', 'date-fns', 'framer-motion'],
          'erp-core': ['./src/core/auth/EnterpriseContext.tsx', './src/core/layout/MainLayout.tsx'],
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  }
}));
