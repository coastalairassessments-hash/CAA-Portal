import { defineConfig } from "vitest/config";

// Needs a local Supabase running. CI starts one; see .github/workflows/db.yml.
export default defineConfig({ test: { include: ["db/**/*.test.ts"], testTimeout: 30_000 } });
