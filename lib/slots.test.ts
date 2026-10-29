import { describe, expect, it } from "vitest";
import { overlaps } from "./slots";

const s = (date: string, time: string, hours: number) => ({ date, time, hours });

describe("overlaps", () => {
  it("10:00 for 3 hours blocks the whole day", () => {
    expect(overlaps(s("2026-10-27", "10:00", 3), s("2026-10-27", "12:30", 1))).toBe(true);
    expect(overlaps(s("2026-10-27", "10:00", 3), s("2026-10-27", "13:00", 1))).toBe(true);
  });
  it("a long visit at 12:30 also blocks an earlier visit that day", () => {
    expect(overlaps(s("2026-10-27", "12:30", 3), s("2026-10-27", "10:00", 1))).toBe(true);
  });
  it("a long visit does not block another day", () => {
    expect(overlaps(s("2026-10-27", "10:00", 4), s("2026-10-28", "10:00", 1))).toBe(false);
  });
  it("10:00 for 2 hours leaves 12:30 and 1:00 open", () => {
    expect(overlaps(s("2026-10-27", "10:00", 2), s("2026-10-27", "13:00", 1))).toBe(false);
  });
  it("10:00 for 2 hours does not block 12:30", () => {
    expect(overlaps(s("2026-10-27", "10:00", 2), s("2026-10-27", "12:30", 2))).toBe(false);
  });
  it("touching ends do not overlap", () => {
    expect(overlaps(s("2026-10-27", "10:00", 2), s("2026-10-27", "12:00", 1))).toBe(false);
  });
  it("different days never overlap", () => {
    expect(overlaps(s("2026-10-27", "10:00", 8), s("2026-10-28", "10:00", 8))).toBe(false);
  });
  it("works both directions", () => {
    expect(overlaps(s("2026-10-27", "12:30", 2), s("2026-10-27", "10:00", 3))).toBe(true);
  });
});
