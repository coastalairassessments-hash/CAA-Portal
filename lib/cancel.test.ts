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

import { LATE_CANCEL_FEE_CENTS, cancelOutcome, policyAllowsLateOptions } from "./cancel";

describe("late-cancel fee", () => {
  const early = new Date("2026-10-26T12:00:00Z"); // 50 hours before
  const late = new Date("2026-10-26T20:00:00Z"); // 18 hours before
  const v3 = "v3-2026-11";

  it("is $250", () => expect(LATE_CANCEL_FEE_CENTS).toBe(25000));
  it("refunds everything more than 24 hours out", () => {
    expect(cancelOutcome("2026-10-28", "10:00", 51375, v3, early)).toMatchObject({ window: "free", feeCents: 0, refundCents: 51375 });
  });
  it("keeps $250 and refunds the rest inside 24 hours (service, PRV, consultation)", () => {
    expect(cancelOutcome("2026-10-27", "10:00", 51375, v3, late)).toMatchObject({ window: "late", feeCents: 25000, refundCents: 26375 });
    expect(cancelOutcome("2026-10-27", "10:00", 43125, v3, late)).toMatchObject({ feeCents: 25000, refundCents: 18125 });
    expect(cancelOutcome("2026-10-27", "10:00", 28125, v3, late)).toMatchObject({ feeCents: 25000, refundCents: 3125 });
  });
  it("treats exactly 24 hours as inside the window", () => {
    const now = new Date("2026-10-26T14:00:00Z");
    expect(cancelOutcome("2026-10-27", "10:00", 51375, v3, now).window).toBe("late");
  });
  it("never charges more than the deposit", () => {
    expect(cancelOutcome("2026-10-27", "10:00", 20000, v3, late)).toMatchObject({ feeCents: 20000, refundCents: 0 });
  });
  it("keeps a v2 booking on the v2 rule: whole deposit kept inside 24 hours", () => {
    expect(policyAllowsLateOptions("v2-2026-11")).toBe(false);
    expect(policyAllowsLateOptions(null)).toBe(false);
    expect(cancelOutcome("2026-10-27", "10:00", 51375, "v2-2026-11", late)).toMatchObject({ feeCents: 51375, refundCents: 0 });
    expect(cancelOutcome("2026-10-28", "10:00", 51375, "v2-2026-11", early).refundCents).toBe(51375);
  });
});
