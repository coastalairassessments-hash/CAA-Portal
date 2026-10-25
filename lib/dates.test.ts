import { describe, expect, it } from "vitest";
import { formatDateLabel, nextBookableDates, todayInNewYork } from "./dates";

// Sunday Oct 25, 2026, 1pm Eastern
const NOW = new Date("2026-10-25T17:00:00Z");

describe("dates", () => {
  it("uses Eastern time for today, even late at night UTC", () => {
    // 11:30pm Eastern on Oct 25 is already Oct 26 in UTC
    expect(todayInNewYork(new Date("2026-10-26T03:30:00Z"))).toBe("2026-10-25");
  });

  it("offers only Monday through Thursday, starting tomorrow", () => {
    expect(nextBookableDates(NOW, 6)).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-11-02",
      "2026-11-03",
    ]);
  });

  it("skips Friday through Sunday when tomorrow is Friday", () => {
    // Thursday Oct 29 -> tomorrow is Friday, so the first date is Monday Nov 2
    const thursday = new Date("2026-10-29T17:00:00Z");
    expect(nextBookableDates(thursday, 1)[0]).toBe("2026-11-02");
  });

  it("formats a friendly label", () => {
    expect(formatDateLabel("2026-10-27")).toBe("Tue, Oct 27");
  });
});
