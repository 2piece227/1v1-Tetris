import { defineConfig } from "vite";

// base "./" keeps asset paths relative so the same build works on
// GitHub Pages (https://<user>.github.io/Tetris/) and any static host.
export default defineConfig({
  base: "./",
  server: {
    host: true, // expose on LAN so the Quest headset can reach the dev server
  },
});
