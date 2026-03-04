import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/waahl_webpage_embed/",
  server: {
    proxy: {
      "/api/ezleagues": {
        target: "https://wingsarena.ezleagues.ezfacility.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) =>
          path.replace(
            /^\/api\/ezleagues/,
            "/leagues/472793/WinterSpring-26-Wings-Arena-Adult-Hockey-League.aspx"
          ),
      },
    },
  },
});