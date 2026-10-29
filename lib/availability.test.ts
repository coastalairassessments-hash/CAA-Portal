import { describe, expect, it } from "vitest";
import { dayFull, hoursForTest, slotTaken } from "./availability";

const d = "2026-11-03";
describe("availability", () => {
  it("a held 1-hour visit takes only its own slot", () => {
    const held = [{ date: d, time: "10:00", hours: 1 }];
    expect(slotTaken(held, d, "10:00", 1)).toBe(true);
    expect(slotTaken(held, d, "12:30", 1)).toBe(false);
  });
  it("a 2-hour visit leaves 12:30 open", () => {
    const held = [{ date: d, time: "10:00", hours: 2 }];
    expect(slotTaken(held, d, "12:30", 1)).toBe(false);
  });
  it("a long visit holds the whole day", () => {
    const held = [{ date: d, time: "10:00", hours: 3 }];
    expect(dayFull(held, d, 1)).toBe(true);
  });
  it("a long visit needs a day with nothing held", () => {
    const held = [{ date: d, time: "12:30", hours: 1 }];
    expect(slotTaken(held, d, "10:00", hoursForTest(true))).toBe(true);
    expect(slotTaken(held, "2026-11-04", "10:00", hoursForTest(true))).toBe(false);
  });
  it("other days are not affected", () => {
    const held = [{ date: d, time: "10:00", hours: 3 }];
    expect(dayFull(held, "2026-11-04", 1)).toBe(false);
  });
});
