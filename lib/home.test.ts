import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { addDays, weekdayOf } from "./dates";
import { homeBack, homeDays, homeWindowEnd, laterBookings, safeBack, weekOf } from "./home";

describe("homeDays", () => {
  it("starts at today and skips days already past", () => {
    const d = homeDays([], [], "2026-11-04"); // a Wednesday
    expect(d[0].date).toBe("2026-11-04");
    expect(d.map((x) => x.date).slice(0, 3)).toEqual(["2026-11-04", "2026-11-05", "2026-11-09"]);
  });
  it("is never empty: on a Saturday it shows next week", () => {
    const d = homeDays([], [], "2026-11-07");
    expect(d[0].date).toBe("2026-11-09");
    expect(d.length).toBeGreaterThan(4);
  });
  it("carries closed days through", () => {
    const d = homeDays([], [{ day: "2026-11-10", slot: "all" }], "2026-11-09");
    expect(d.find((x) => x.date === "2026-11-10")?.dayClosed).toBe(true);
  });
  it("groups a week", () => {
    const d = homeDays([], [], "2026-11-04");
    expect(weekOf(d, "2026-11-05").map((x) => x.date)).toEqual(["2026-11-04", "2026-11-05"]);
  });
});

describe("back links", () => {
  it("builds and accepts only its own shape", () => {
    expect(homeBack("2026-11-04", "week")).toBe("/admin/today?d=2026-11-04&v=week");
    expect(homeBack("junk", "day")).toBe("/admin/today");
    expect(safeBack("/admin/today?d=2026-11-04&v=day")).toBe("/admin/today?d=2026-11-04&v=day");
    expect(safeBack("/admin/today")).toBe("/admin/today");
    expect(safeBack("https://evil.com")).toBeNull();
    expect(safeBack("/admin/today?d=x")).toBeNull();
  });
});

describe("later bookings", () => {
  // 2026-11-27 is a Friday: the schedule draws Mon Nov 23 through Sun Dec 13.
  const today = "2026-11-27";
  const row = (confirmed_date: string | null, o: Record<string, unknown> = {}) => ({ status: "confirmed", confirmed_date, confirmed_time: "10:00", left_at: null, ...o });

  it("the window ends on the Sunday of its last week", () => {
    expect(homeWindowEnd(today)).toBe("2026-12-13");
    expect(homeWindowEnd(today, 1)).toBe("2026-11-29");
  });
  it("lists a confirmed visit just past the window, soonest first, and not one inside it", () => {
    const rows = [row("2026-12-21"), row("2026-12-14", { confirmed_time: "12:30" }), row("2026-12-14"), row("2026-12-13"), row("2026-11-30")];
    expect(laterBookings(rows, today).map((r) => `${r.confirmed_date} ${r.confirmed_time}`)).toEqual(["2026-12-14 10:00", "2026-12-14 12:30", "2026-12-21 10:00"]);
  });
  it("leaves out cancelled, unpaid-offer, finished and undated rows", () => {
    const rows = [row("2026-12-21", { status: "cancelled" }), row("2026-12-21", { status: "offered" }), row("2026-12-21", { left_at: "x" }), row(null)];
    expect(laterBookings(rows, today)).toEqual([]);
  });
  it("shares its cutoff with the schedule: every confirmed future date is drawn or listed, never neither", () => {
    for (let i = 0; i < 120; i++) {
      const d = addDays(today, i);
      const drawn = homeDays([], [], today).some((x) => x.date === d);
      const listed = laterBookings([row(d)], today).length === 1;
      if ([1, 2, 3, 4].includes(weekdayOf(d))) expect(drawn || listed).toBe(true); // bookable days are Mon-Thu, which this codebase counts as 1-4
      expect(drawn && listed).toBe(false);
    }
  });
});

describe("the Home page", () => {
  it("draws the Later list from the same rows and the same today as the schedule", () => {
    const src = readFileSync("app/admin/today/page.tsx", "utf8");
    expect(src).toContain("<Later rows={laterBookings(all, today) as Job[]} />");
    expect(src).toContain("homeDays(all as unknown as WeekRow[], blockData ?? [], today)");
  });
});
