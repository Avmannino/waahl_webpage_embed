import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/waahl_webpage_embed/",
  server: {
    proxy: {
      "/api/ezleagues-premier": {
        target: "https://wingsarena.ezleagues.ezfacility.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/ezleagues-premier/,
            "/leagues/479627/Fall--Winter-2026-AB.aspx"
          ),
      },
      "/api/ezleagues-legends": {
        target: "https://wingsarena.ezleagues.ezfacility.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/ezleagues-legends/,
            "/leagues/479649/Fall--Winter-2026-Legends-League.aspx"
          ),
      },
    },
  },
});