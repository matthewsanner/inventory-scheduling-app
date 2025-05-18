import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import flowbiteReact from "flowbite-react/plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), flowbiteReact()],
  test: {
    environment: "jsdom", // run tests in browser-like environment
    globals: true,
    setupFiles: "./src/setupTests.js",
  },
});
