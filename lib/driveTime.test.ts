import { describe, expect, it } from "vitest";
import { conflictText, driveConflict, driveZone, nearestOkDays, tooFar, type Zoned } from "./driveTime";
import { overlaps } from "./slots";
import { dayFull, slotUnavailable, soonestSlot } from "./availability";

const v = (time: string, hours: number, zone: Zoned["zone"], date = "2026-11-10"): Zoned => ({ date, time, hours, zone });

describe("driveZone", () => {
  it("maps ZIPs to counties", () => {
    expect(driveZone("34997")).toBe("martin");
    expect(driveZone("34986")).toBe("st-lucie");
    expect(driveZone("33401")).toBe("palm-beach");
    expect(driveZone("32960")).toBe("indian-river");
    expect(driveZone("32901")).toBe("brevard");
  });
  it("returns null for unknown or bad ZIPs", () => {
    expect(driveZone("90210")).toBeNull();
    expect(driveZone("")).toBeNull();
    expect(driveZone(null)).toBeNull();
    expect(driveZone("abc")).toBeNull();
  });
});

describe("tooFar", () => {
  it("flags Palm Beach then Vero with only 90 minutes between", () => {
    const t = tooFar(v("10:00", 1, "palm-beach"), v("12:30", 1, "indian-river"));
    expect(t).not.toBeNull();
    expect(t!.gap).toBe(90);
    expect(t!.need).toBe(115);
    expect(conflictText(t!)).toContain("Indian River");
  });
  it("works whichever visit is booked first", () => {
    expect(tooFar(v("12:30", 1, "indian-river"), v("10:00", 1, "palm-beach"))).not.toBeNull();
  });
  it("allows neighbouring counties after a one hour visit", () => {
    expect(tooFar(v("10:00", 1, "martin"), v("12:30", 1, "st-lucie"))).toBeNull();
    expect(tooFar(v("10:00", 1, "palm-beach"), v("12:30", 1, "martin"))).toBeNull();
  });
  it("allows a two hour visit followed by one in the same county", () => {
    expect(tooFar(v("10:00", 2, "martin"), v("12:30", 1, "martin"))).toBeNull();
  });
  it("flags a two hour visit followed by a different county", () => {
    expect(tooFar(v("10:00", 2, "indian-river"), v("12:30", 1, "martin"))).not.toBeNull();
  });
  it("ignores unknown areas, other days and overlaps", () => {
    expect(tooFar(v("10:00", 1, null), v("12:30", 1, "indian-river"))).toBeNull();
    expect(tooFar(v("10:00", 1, "palm-beach"), v("12:30", 1, "indian-river", "2026-11-11"))).toBeNull();
    expect(tooFar(v("10:00", 3, "palm-beach"), v("12:30", 1, "indian-river"))).toBeNull();
  });
});

describe("driveConflict and availability", () => {
  const held = [v("10:00", 1, "palm-beach")];
  it("finds the first conflict", () => {
    expect(driveConflict(held, v("12:30", 1, "indian-river"))).not.toBeNull();
    expect(driveConflict(held, v("12:30", 1, "martin"))).toBeNull();
  });
  it("hides a far second slot only for that area", () => {
    expect(slotUnavailable(held, "2026-11-10", "12:30", 1, "indian-river")).toBe(true);
    expect(slotUnavailable(held, "2026-11-10", "12:30", 1, "martin")).toBe(false);
    expect(slotUnavailable(held, "2026-11-10", "12:30", 1, null)).toBe(false);
  });
  it("marks a day full when no start time fits", () => {
    expect(dayFull(held, "2026-11-10", 1, "indian-river")).toBe(true); // 10:00 is held, 12:30 is too far
    expect(dayFull(held, "2026-11-10", 1, "martin")).toBe(false); // 12:30 still works
  });
  it("soonest slot skips far times", () => {
    const s = soonestSlot(["2026-11-10", "2026-11-11"], held, false, "indian-river");
    expect(s).toEqual({ date: "2026-11-11", time: "10:00" });
  });
});

describe("nearestOkDays", () => {
  it("suggests the closest Monday to Thursday days that fit, not the same day", () => {
    const held = [v("10:00", 1, "palm-beach", "2026-11-10")];
    const days = nearestOkDays(held, v("12:30", 1, "indian-river", "2026-11-10"), overlaps);
    expect(days).toHaveLength(3);
    expect(days).not.toContain("2026-11-10");
    for (const d of days) expect([1, 2, 3, 4]).toContain(new Date(`${d}T12:00:00Z`).getUTCDay());
  });
  it("skips days that already clash", () => {
    const held = [v("10:00", 1, "palm-beach", "2026-11-10"), v("10:00", 1, "palm-beach", "2026-11-11")];
    const days = nearestOkDays(held, v("12:30", 1, "indian-river", "2026-11-10"), overlaps);
    expect(days).not.toContain("2026-11-11");
  });
});
