import { describe, expect, it } from "vitest";
import { newYorkToDate, visitFromEntry } from "./visitTime";
import { minutesOnSite } from "./billing";

describe("visit times by hand", () => {
  it("reads New York clock times in winter and summer", () => {
    expect(newYorkToDate("2026-11-10", "10:00")?.toISOString()).toBe("2026-11-10T15:00:00.000Z");
    expect(newYorkToDate("2026-07-10", "10:00")?.toISOString()).toBe("2026-07-10T14:00:00.000Z");
    expect(newYorkToDate("2026-13-10", "10:00")).toBeNull();
    expect(newYorkToDate("2026-11-10", "25:00")).toBeNull();
  });
  it("uses arrived and left times", () => {
    const r = visitFromEntry({ date: "2026-11-10", arrive: "10:05", leave: "12:50", hours: "", plannedTime: "10:00" });
    expect(r.ok && minutesOnSite(r.arrived_at, r.left_at)).toBe(165);
  });
  it("uses total hours from the planned start when arrived is blank", () => {
    const r = visitFromEntry({ date: "2026-11-10", arrive: "", leave: "", hours: "2.5", plannedTime: "10:00:00" });
    expect(r.ok && r.arrived_at).toBe("2026-11-10T15:00:00.000Z");
    expect(r.ok && minutesOnSite(r.arrived_at, r.left_at)).toBe(150);
  });
  it("rejects leaving before arriving, missing times and silly hours", () => {
    expect(visitFromEntry({ date: "2026-11-10", arrive: "12:00", leave: "11:00", hours: "", plannedTime: null }).ok).toBe(false);
    expect(visitFromEntry({ date: "2026-11-10", arrive: "12:00", leave: "", hours: "", plannedTime: null }).ok).toBe(false);
    expect(visitFromEntry({ date: "2026-11-10", arrive: "", leave: "", hours: "30", plannedTime: "10:00" }).ok).toBe(false);
    expect(visitFromEntry({ date: "", arrive: "", leave: "", hours: "2", plannedTime: null }).ok).toBe(false);
  });
});
