import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path alias in tsconfig.json.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Unit tests only. Browser-level behaviour lives in e2e/ and runs against a
    // real deployment, so nothing here needs a DOM.
    environment: "node",
    // .tsx included so a component test is never silently skipped. Adding one
    // means switching to environment: "jsdom" and a setup file.
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
