import { describe, expect, it } from "vitest";
import { liveState } from "./live";
import { enRouteEmail } from "./enroute";

const base = { status: "confirmed", confirmed_date: "2026-11-03" };
describe("liveState", () => {
  it("is off unless confirmed and today", () => {
    expect(liveState(base, "2026-11-02")).toBeNull();
    expect(liveState({ ...base, status: "offered" }, "2026-11-03")).toBeNull();
  });
  it("walks the day", () => {
    expect(liveState(base, "2026-11-03")?.step).toBe(1);
    expect(liveState({ ...base, en_route_at: "2026-11-03T13:42:00Z" }, "2026-11-03")?.detail).toContain("8:42 AM");
    expect(liveState({ ...base, en_route_at: "x", arrived_at: "2026-11-03T15:02:00Z" }, "2026-11-03")?.step).toBe(3);
    expect(liveState({ ...base, arrived_at: "x", left_at: "y" }, "2026-11-03")?.step).toBe(4);
  });
  it("writes the on-the-way email with the live link", () => {
    const m = enRouteEmail({ name: "Pat Lee", public_token: "abc" });
    expect(m.text).toContain("Follow along:");
    expect(m.text).toContain("/booking/abc");
  });
});
