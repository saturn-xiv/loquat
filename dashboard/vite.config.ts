import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: "/my/",
  server: {
    host: "127.0.0.1",
    port: 9527,
    proxy: {
      "/graphql": "http://127.0.0.1:8080",
    },
  },
  plugins: [react()],
});
