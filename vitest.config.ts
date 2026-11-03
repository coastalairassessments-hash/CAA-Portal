import { defineConfig } from "vitest/config";

// The browser-style tests in e2e/ run under Playwright, not here.
export default defineConfig({
  test: { exclude: ["e2e/**", "node_modules/**", ".next/**", "test-results/**"] },
});
