import { describe, expect, it } from "vitest";
import { dayBeforeEmail, prepLines } from "./prep";

describe("prep", () => {
  it("lists the do and don't items", () => {
    const t = prepLines().join("\n");
    expect(t).toContain("Turn off air purifiers and dehumidifiers");
    expect(t).toContain("Don't cook on the stove top, take long hot showers, or vape");
  });
  it("writes the day-before email with the booking link", () => {
    const m = dayBeforeEmail({ name: "Pat Lee", phone: "", address: "1 Main", city: "Stuart", zip: "34994", public_token: "abc" }, { date: "2026-11-03", time: "10:00" });
    expect(m.subject).toBe("Tomorrow: your visit at 10:00 AM");
    expect(m.text).toContain("/booking/abc");
    expect(m.text).toContain("Keep windows and doors closed");
  });
});
