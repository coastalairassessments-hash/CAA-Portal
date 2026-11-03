import { defineConfig } from "@playwright/test";

// These tests knock on the locked doors of the running site the way a stranger would. No browser and no database needed:
// with no Supabase settings the site must fail closed, so every locked page has to stay locked.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: "http://localhost:3100" },
  webServer: {
    command: "npx next dev --port 3100",
    url: "http://localhost:3100/portal",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "", SUPABASE_PUBLISHABLE_KEY: "" },
  },
});
