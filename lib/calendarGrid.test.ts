import { describe, expect, it } from "vitest";
import { monthTitle, monthWeeks, monthsOf } from "./calendarGrid";

describe("calendar grid", () => {
  it("lists the months that have bookable dates", () => {
    expect(monthsOf(["2026-10-29", "2026-11-02", "2026-10-30"])).toEqual(["2026-10", "2026-11"]);
  });
  it("builds Monday to Thursday rows for October 2026", () => {
    const w = monthWeeks("2026-10");
    // Oct 1, 2026 is a Thursday.
    expect(w[0]).toEqual([null, null, null, "2026-10-01"]);
    expect(w[1]).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"]);
    expect(w[w.length - 1]).toEqual(["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29"]);
    expect(w.flat().filter(Boolean)).toHaveLength(17);
  });
  it("skips a week that has no Monday to Thursday days in the month", () => {
    // Nov 2026 starts on a Sunday; its first Mon-Thu row is Nov 2.
    const w = monthWeeks("2026-11");
    expect(w[0]).toEqual(["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"]);
    expect(w.flat().every((d) => d === null || d.startsWith("2026-11"))).toBe(true);
  });
  it("titles the month", () => {
    expect(monthTitle("2026-10")).toBe("October 2026");
  });
});
