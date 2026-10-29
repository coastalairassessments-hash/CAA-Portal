import { describe, expect, it } from "vitest";
import { buildWeek, mondayOf, type WeekRow } from "./week";

const row = (o: Partial<WeekRow>): WeekRow => ({
  id: "1", status: "confirmed", name: "A", issue: "musty_smell",
  confirmed_date: null, confirmed_time: null, preferred_date: null, preferred_time: null, block_hours: 1, ...o,
});

describe("week", () => {
  it("finds the Monday", () => {
    expect(mondayOf("2026-11-04")).toBe("2026-11-02");
    expect(mondayOf("2026-11-02")).toBe("2026-11-02");
  });
  it("marks booked, pending and open", () => {
    const w = buildWeek(
      [
        row({ confirmed_date: "2026-11-03", confirmed_time: "10:00:00" }),
        row({ id: "2", status: "new", preferred_date: "2026-11-03", preferred_time: "12:30" }),
      ],
      "2026-11-02",
    );
    expect(w[1].cells.map((c) => c.state)).toEqual(["booked", "pending"]);
    expect(w[0].cells.map((c) => c.state)).toEqual(["open", "open"]);
  });
  it("a long visit blocks the other slot", () => {
    const w = buildWeek([row({ confirmed_date: "2026-11-03", confirmed_time: "10:00", block_hours: 3 })], "2026-11-02");
    expect(w[1].cells.map((c) => c.state)).toEqual(["booked", "blocked"]);
  });
  it("shows closed times", () => {
    const w = buildWeek([], "2026-11-02", [{ day: "2026-11-03", slot: "12:30" }, { day: "2026-11-04", slot: "all" }]);
    expect(w[1].cells.map((c) => c.state)).toEqual(["open", "closed"]);
    expect(w[2].cells.map((c) => c.state)).toEqual(["closed", "closed"]);
    expect(w[2].dayClosed).toBe(true);
  });
});
