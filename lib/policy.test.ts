import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { POLICY_INTRO, POLICY_SECTIONS, POLICY_VERSION } from "./policy";

// If this fails, the policy wording changed. Add a new version instead of editing in place.
const V2_FINGERPRINT = "cc7f46658b745bde3b971238e2bda9f71f946b46730cc6f4c4cbe816b1b019f3";

describe("booking policy", () => {
  it("has six sections in order", () => {
    expect(POLICY_SECTIONS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it("matches the locked fingerprint for its version", () => {
    const hash = createHash("sha256").update(JSON.stringify({ POLICY_INTRO, POLICY_SECTIONS })).digest("hex");
    expect({ version: POLICY_VERSION, hash }).toEqual({ version: "v2-2026-11", hash: V2_FINGERPRINT });
  });
  it("states the prices and rules the app uses", () => {
    const all = JSON.stringify(POLICY_SECTIONS);
    expect(all).toContain("$195");
    expect(all).toContain("75%");
    expect(all).toContain("$85");
    expect(all).toContain("24 hours");
    expect(all).toContain("not refunded");
  });
});

describe("PRV notice", () => {
  it("says a fail is still charged and not refunded", async () => {
    const { PRV_NOTICE } = await import("./policy");
    expect(PRV_NOTICE).toMatch(/charged in full/);
    expect(PRV_NOTICE).toMatch(/not refunded/);
  });
});
