import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { POLICY_INTRO, POLICY_SECTIONS, POLICY_VERSION } from "./policy";

// If this fails, the policy wording changed. Add a new version instead of editing in place.
const V1_FINGERPRINT = "b5e9dc326fff18c5b85d8415882684addccf128b645eeef38cd64cd6332db59f";

describe("booking policy", () => {
  it("has five sections in order", () => {
    expect(POLICY_SECTIONS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5]);
  });
  it("matches the locked fingerprint for its version", () => {
    const hash = createHash("sha256").update(JSON.stringify({ POLICY_INTRO, POLICY_SECTIONS })).digest("hex");
    expect({ version: POLICY_VERSION, hash }).toEqual({ version: "v1-2026-10", hash: V1_FINGERPRINT });
  });
  it("states the prices and rules the app uses", () => {
    const all = JSON.stringify(POLICY_SECTIONS);
    expect(all).toContain("$195");
    expect(all).toContain("75%");
    expect(all).toContain("$85");
    expect(all).toContain("24 hours");
  });
});
