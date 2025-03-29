import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/generate-chain": "http://localhost:5001",
      "/send-emails": "http://localhost:5001",
      "/api": "http://localhost:5001",
    },
  },
});
