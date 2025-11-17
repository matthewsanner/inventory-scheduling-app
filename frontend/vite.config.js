import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom", // run tests in browser-like environment
    globals: true,
    setupFiles: "./src/setupTests.js",
    reporters: ["default", "hanging-process"],
  },
});
