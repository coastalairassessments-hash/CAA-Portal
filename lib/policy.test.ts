import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { POLICY_INTRO, POLICY_SECTIONS, POLICY_VERSION } from "./policy";

// If this fails, the policy wording changed. Add a new version instead of editing in place.
const V3_FINGERPRINT = "fbec6a5f0bcafe59d62b0b3c3efd047223551a1f390083dd66ece8a88999d3eb";

describe("booking policy", () => {
  it("has six sections in order", () => {
    expect(POLICY_SECTIONS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it("matches the locked fingerprint for its version", () => {
    const hash = createHash("sha256").update(JSON.stringify({ POLICY_INTRO, POLICY_SECTIONS })).digest("hex");
    expect({ version: POLICY_VERSION, hash }).toEqual({ version: "v3-2026-11", hash: V3_FINGERPRINT });
  });
  it("states the prices and rules the app uses", () => {
    const all = JSON.stringify(POLICY_SECTIONS);
    expect(all).toContain("$195");
    expect(all).toContain("75%");
    expect(all).toContain("$85");
    expect(all).toContain("24 hours");
    expect(all).toContain("$250");
    expect(all).toContain("reschedule once");
  });
});

describe("PRV notice", () => {
  it("says a fail is still charged and not refunded", async () => {
    const { PRV_NOTICE } = await import("./policy");
    expect(PRV_NOTICE).toMatch(/charged in full/);
    expect(PRV_NOTICE).toMatch(/not refunded/);
  });
});
