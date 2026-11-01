import { describe, expect, it } from "vitest";
import { hashToken, loginExpiry, newToken, parseContractorRequest, parseEmail, sessionExpiry, validToken } from "./contractorAuth";

const NOW = new Date("2026-11-02T15:00:00Z"); // Monday
describe("tokens", () => {
  it("are 64 hex characters and unique", () => {
    const a = newToken();
    expect(validToken(a)).toBe(true);
    expect(newToken()).not.toBe(a);
  });
  it("hash the same way every time, and differently from the token", async () => {
    const t = newToken();
    expect(await hashToken(t)).toBe(await hashToken(t));
    expect(await hashToken(t)).not.toBe(t);
  });
  it("rejects bad tokens", () => {
    expect(validToken("abc")).toBe(false);
    expect(validToken(undefined)).toBe(false);
  });
});
describe("expiry", () => {
  it("is 15 minutes for a link and 30 days for a session", () => {
    expect(loginExpiry(NOW)).toBe("2026-11-02T15:15:00.000Z");
    expect(sessionExpiry(NOW)).toBe("2026-12-02T15:00:00.000Z");
  });
});
describe("parseEmail", () => {
  it("lowercases and trims", () => {
    const r = parseEmail("  Bob@Roofing.COM ");
    expect(r.success && r.data).toBe("bob@roofing.com");
  });
  it("rejects junk", () => expect(parseEmail("nope").success).toBe(false));
});
describe("parseContractorRequest", () => {
  const ok = { service: "prv", address: "12 Palm Rd, Stuart", date: "2026-11-03", time: "10:00" };
  it("accepts a Tuesday 10:00", () => expect(parseContractorRequest(ok, NOW).success).toBe(true));
  it("rejects weekends, today and bad times", () => {
    expect(parseContractorRequest({ ...ok, date: "2026-11-07" }, NOW).success).toBe(false);
    expect(parseContractorRequest({ ...ok, date: "2026-11-02" }, NOW).success).toBe(false);
    expect(parseContractorRequest({ ...ok, time: "09:00" }, NOW).success).toBe(false);
  });
  it("needs an address", () => expect(parseContractorRequest({ ...ok, address: "" }, NOW).success).toBe(false));
});
