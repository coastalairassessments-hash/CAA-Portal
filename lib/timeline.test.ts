import { describe, expect, it } from "vitest";
import { addBusinessDays, timeline } from "./timeline";

const NOW = new Date("2026-11-04T15:00:00Z"); // Wed
const base = { status: "confirmed", confirmed_date: "2026-11-05", left_at: null, lab_samples: 0, report_path: null, report_released_at: null, final_paid_at: null };
const visited = { ...base, confirmed_date: "2026-11-03", left_at: "2026-11-03T18:00:00Z" }; // Tue visit
const keys = (r: Parameters<typeof timeline>[0], now = NOW) => timeline(r, now)?.map((s) => `${s.key}:${s.state}`);

describe("addBusinessDays", () => {
  it("skips weekends", () => {
    expect(addBusinessDays("2026-11-05", 1)).toBe("2026-11-06"); // Thu -> Fri
    expect(addBusinessDays("2026-11-05", 2)).toBe("2026-11-09"); // Thu -> Mon
    expect(addBusinessDays("2026-11-04", 3)).toBe("2026-11-09"); // Wed -> Mon
    expect(addBusinessDays("2026-11-07", 1)).toBe("2026-11-09"); // Sat -> Mon
  });
});

describe("timeline", () => {
  it("shows nothing before booking or after cancel", () => {
    expect(timeline({ ...base, status: "offered" }, NOW)).toBeNull();
    expect(timeline({ ...base, status: "cancelled" }, NOW)).toBeNull();
    expect(timeline({ ...base, status: "declined" }, NOW)).toBeNull();
  });
  it("waits at the inspection until the visit is done", () => {
    expect(keys(base)).toEqual(["booked:done", "visit:current", "report:upcoming", "delivered:upcoming"]);
    expect(timeline(base, NOW)?.[1].note).toBe("Your visit is Thu, Nov 5.");
  });
  it("hides the lab step on jobs without samples, shows it with samples", () => {
    expect(timeline(visited, NOW)?.some((s) => s.key === "lab")).toBe(false);
    expect(keys({ ...visited, lab_samples: 2 })).toEqual(["booked:done", "visit:done", "lab:current", "report:upcoming", "delivered:upcoming"]);
  });
  it("moves past the lab on its own after the window", () => {
    const later = new Date("2026-11-05T15:00:00Z"); // 2 business days after Tue visit
    expect(keys({ ...visited, lab_samples: 2 }, later)).toEqual(["booked:done", "visit:done", "lab:done", "report:current", "delivered:upcoming"]);
  });
  it("gives an expected-by date for the report", () => {
    const step = timeline(visited, NOW)?.find((s) => s.key === "report");
    expect(step?.state).toBe("current");
    expect(step?.note).toContain("Expected by Fri, Nov 6");
  });
  it("holds delivery until final payment", () => {
    const locked = { ...visited, report_path: "x/y.pdf" };
    expect(keys(locked)).toEqual(["booked:done", "visit:done", "report:done", "delivered:current"]);
    expect(timeline(locked, NOW)?.[3].note).toBe("Your report is ready. Pay your final invoice to unlock it.");
    expect(keys({ ...locked, final_paid_at: "2026-11-04T12:00:00Z" })).toEqual(["booked:done", "visit:done", "report:done", "delivered:done"]);
    expect(keys({ ...locked, report_released_at: "2026-11-04T12:00:00Z" })?.at(-1)).toBe("delivered:done");
  });
  it("counts a finished lab as done once the report exists", () => {
    expect(keys({ ...visited, lab_samples: 1, report_path: "x/y.pdf" })).toEqual(["booked:done", "visit:done", "lab:done", "report:done", "delivered:current"]);
  });
});
