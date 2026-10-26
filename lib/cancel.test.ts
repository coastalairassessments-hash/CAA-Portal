import { describe, expect, it } from "vitest";
import { easternInstant, hoursUntil, refundDue } from "./cancel";

describe("cancellation window", () => {
  it("converts Eastern time to the real moment (EDT, UTC-4)", () => {
    expect(easternInstant("2026-10-27", "10:00").toISOString()).toBe("2026-10-27T14:00:00.000Z");
  });
  it("handles standard time after the clocks change (EST, UTC-5)", () => {
    expect(easternInstant("2026-11-02", "10:00").toISOString()).toBe("2026-11-02T15:00:00.000Z");
  });
  it("refunds when more than 24 hours out", () => {
    const now = new Date("2026-10-26T12:00:00Z"); // 8:00 AM Eastern Monday
    expect(refundDue("2026-10-28", "10:00", now)).toBe(true); // 50 hours
    expect(hoursUntil("2026-10-28", "10:00", now)).toBe(50);
  });
  it("keeps the deposit inside 24 hours", () => {
    const now = new Date("2026-10-26T20:00:00Z"); // 4:00 PM Eastern, 18 hours before
    expect(refundDue("2026-10-27", "10:00", now)).toBe(false);
  });
  it("is not refundable at 24 hours or less", () => {
    const now = new Date("2026-10-26T14:00:00Z");
    expect(refundDue("2026-10-27", "10:00", now)).toBe(false); // exactly 24h
    expect(refundDue("2026-10-27", "12:30", now)).toBe(true); // 26.5h
  });
});
