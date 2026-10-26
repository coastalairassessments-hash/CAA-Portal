import { describe, expect, it } from "vitest";
import { parseRequest } from "./request";

// Fixed "now": Sunday Oct 25, 2026, 1pm Eastern
const NOW = new Date("2026-10-25T17:00:00Z");

const good = {
  issue: "musty_smell",
  sizeBand: "2000_4000",
  preferredDate: "2026-10-27", // Tuesday
  preferredTime: "10:00",
  name: "Pat Client",
  phone: "(772) 555-0142",
  email: "pat@example.com",
  address: "123 Ocean Blvd",
  city: "Stuart",
  zip: "34994",
  notes: "",
  textConsent: true,
  termsAccepted: true,
  website: "",
};

describe("parseRequest", () => {
  it("accepts a good request and normalizes the phone", () => {
    const r = parseRequest(good, NOW);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.phone).toBe("+17725550142");
      expect(r.data.zip).toBe("34994");
    }
  });

  it("rejects missing name", () => {
    expect(parseRequest({ ...good, name: "  " }, NOW).success).toBe(false);
  });

  it("rejects a bad phone number", () => {
    expect(parseRequest({ ...good, phone: "12345" }, NOW).success).toBe(false);
  });

  it("rejects a bad email", () => {
    expect(parseRequest({ ...good, email: "not-an-email" }, NOW).success).toBe(false);
  });

  it("rejects a bad ZIP", () => {
    expect(parseRequest({ ...good, zip: "3499" }, NOW).success).toBe(false);
  });

  it("rejects an unknown issue or size band", () => {
    expect(parseRequest({ ...good, issue: "ghosts" }, NOW).success).toBe(false);
    expect(parseRequest({ ...good, sizeBand: "huge" }, NOW).success).toBe(false);
  });

  it("rejects a time slot that is not offered", () => {
    expect(parseRequest({ ...good, preferredTime: "15:00" }, NOW).success).toBe(false);
  });

  it("rejects Friday, Saturday and Sunday", () => {
    for (const d of ["2026-10-30", "2026-10-31", "2026-11-01"]) {
      expect(parseRequest({ ...good, preferredDate: d }, NOW).success).toBe(false);
    }
  });

  it("accepts Monday through Thursday", () => {
    for (const d of ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29"]) {
      expect(parseRequest({ ...good, preferredDate: d }, NOW).success).toBe(true);
    }
  });

  it("rejects past dates", () => {
    expect(parseRequest({ ...good, preferredDate: "2026-10-22" }, NOW).success).toBe(false);
  });

  it("rejects dates too far out and impossible dates", () => {
    expect(parseRequest({ ...good, preferredDate: "2027-12-06" }, NOW).success).toBe(false);
    expect(parseRequest({ ...good, preferredDate: "2026-02-30" }, NOW).success).toBe(false);
  });

  it("rejects a filled honeypot (bot)", () => {
    expect(parseRequest({ ...good, website: "http://spam.example" }, NOW).success).toBe(false);
  });

  it("rejects oversized notes", () => {
    expect(parseRequest({ ...good, notes: "x".repeat(1001) }, NOW).success).toBe(false);
  });
});
