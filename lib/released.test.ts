import { describe, expect, it } from "vitest";
import { releasedEmail } from "./released";

describe("released time email", () => {
  const e = releasedEmail({ name: "Pat Lee", public_token: "a".repeat(32) }, { date: "2026-11-02", time: "10:00" }, "https://x.com");
  it("says nothing was charged and links to book again", () => {
    expect(e.text).toContain("You were not charged");
    expect(e.text).toContain(`https://x.com/request?again=${"a".repeat(32)}`);
    expect(e.text.startsWith("Hi Pat,")).toBe(true);
  });
  it("is not alarming", () => {
    expect(e.text.toLowerCase()).not.toMatch(/urgent|warning|failed|penalty/);
  });
  it("falls back to the request page without a token", () => {
    expect(releasedEmail({ name: "Pat" }, { date: "2026-11-02", time: "10:00" }, "https://x.com/").text).toContain("https://x.com/request");
  });
});
