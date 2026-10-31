import { describe, expect, it } from "vitest";
import { homeBack, homeDays, safeBack, weekOf } from "./home";

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
