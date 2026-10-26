import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { TERMS_PREAMBLE, TERMS_SECTIONS, TERMS_VERSION } from "./terms";

// Fingerprint of the exact words clients agree to. If this fails, someone edited the
// terms. Do not just update the number: add a new version (TERMS_V2) and bump TERMS_VERSION.
const V1_FINGERPRINT = "6554c979b455b95113197b8df9ad1d2a83785d0a539368da4bdf95f85cdfd1e5";

describe("terms", () => {
  it("has all 14 sections in order", () => {
    expect(TERMS_SECTIONS.map((s) => s.n)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
  });
  it("matches the locked fingerprint for its version", () => {
    const hash = createHash("sha256")
      .update(JSON.stringify({ TERMS_PREAMBLE, TERMS_SECTIONS }))
      .digest("hex");
    expect({ version: TERMS_VERSION, hash }).toEqual({ version: "v1-2026-10", hash: V1_FINGERPRINT });
  });
  it("no longer mentions Jobber", () => {
    expect(JSON.stringify(TERMS_SECTIONS)).not.toMatch(/jobber/i);
  });
});
