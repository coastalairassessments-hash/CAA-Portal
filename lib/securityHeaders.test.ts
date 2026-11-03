import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "./securityHeaders";

const get = (k: string) => SECURITY_HEADERS.find((h) => h.key === k)?.value;
describe("security headers", () => {
  it("keeps the private booking link from leaving the site", () => {
    expect(get("Referrer-Policy")).toBe("same-origin");
  });
  it("blocks framing, sniffing and plugins", () => {
    expect(get("X-Frame-Options")).toBe("DENY");
    expect(get("X-Content-Type-Options")).toBe("nosniff");
    expect(get("Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(get("Content-Security-Policy")).toContain("object-src 'none'");
  });
  it("forces https", () => {
    expect(get("Strict-Transport-Security")).toMatch(/max-age=\d{7,}/);
  });
  it("has no duplicate headers", () => {
    const keys = SECURITY_HEADERS.map((h) => h.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
