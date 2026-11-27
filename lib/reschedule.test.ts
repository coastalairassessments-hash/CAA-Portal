import { describe, expect, it } from "vitest";
import { canMove, moveOptions, movedEmail } from "./reschedule";

const NOW = new Date("2026-11-02T15:00:00Z"); // Mon 10:00 AM Eastern
const base = { status: "confirmed", source: "client", confirmed_date: "2026-11-05", confirmed_time: "10:00:00", arrived_at: null, left_at: null };

describe("canMove", () => {
  it("allows a visit more than 24 hours away", () => expect(canMove(base, NOW)).toBe(true));
  it("blocks inside 24 hours", () => expect(canMove({ ...base, confirmed_date: "2026-11-03" }, NOW)).toBe(false));
  it("blocks started, cancelled and contractor jobs", () => {
    expect(canMove({ ...base, arrived_at: "x" }, NOW)).toBe(false);
    expect(canMove({ ...base, status: "cancelled" }, NOW)).toBe(false);
    expect(canMove({ ...base, source: "contractor" }, NOW)).toBe(false);
  });
});

describe("moveOptions", () => {
  const cur = { date: "2026-11-05", time: "10:00", hours: 1 };
  const dates = ["2026-11-03", "2026-11-05", "2026-11-09"];
  const times = ["10:00", "12:30"];
  it("skips inside 24 hours and the current time, keeps the rest", () => {
    const o = moveOptions(dates, times, [], cur, NOW);
    expect(o).toEqual([
      { date: "2026-11-03", time: "12:30" },
      { date: "2026-11-05", time: "12:30" },
      { date: "2026-11-09", time: "10:00" },
      { date: "2026-11-09", time: "12:30" },
    ]);
  });
  it("skips times others hold, but not the client's own", () => {
    const held = [cur, { date: "2026-11-09", time: "10:00", hours: 1 }];
    const o = moveOptions(dates, times, held, cur, NOW);
    expect(o.some((s) => s.date === "2026-11-09" && s.time === "10:00")).toBe(false);
    expect(o.some((s) => s.date === "2026-11-05" && s.time === "12:30")).toBe(true);
  });
});

describe("movedEmail", () => {
  it("says the new time and keeps the deposit", () => {
    const m = movedEmail({ name: "Sam Lee", address: "1 A St", city: "Stuart", zip: "34994", public_token: "a".repeat(32) }, "id1", { date: "2026-11-09", time: "10:00", hours: 1 }, "https://x.test");
    expect(m.subject).toContain("Your visit moved");
    expect(m.text).toContain("deposit carries over");
    expect(m.attachments[0].filename).toBe("visit.ics");
  });
});

import { canLateMove } from "./reschedule";

describe("one free late reschedule", () => {
  const row = { status: "confirmed", source: "client", confirmed_date: "2026-10-27", confirmed_time: "10:00", policy_version: "v3-2026-11", late_reschedules: 0 };
  const inside = new Date("2026-10-26T20:00:00Z"); // 18 hours before
  it("is offered inside 24 hours", () => expect(canLateMove(row, inside)).toBe(true));
  it("is not offered more than 24 hours out (the ordinary move applies)", () => {
    expect(canLateMove(row, new Date("2026-10-25T12:00:00Z"))).toBe(false);
  });
  it("is spent after one use", () => expect(canLateMove({ ...row, late_reschedules: 1 }, inside)).toBe(false));
  it("is not offered under the old v2 policy", () => expect(canLateMove({ ...row, policy_version: "v2-2026-11" }, inside)).toBe(false));
  it("is not offered once the visit has started or passed", () => {
    expect(canLateMove({ ...row, arrived_at: "2026-10-27T14:00:00Z" }, inside)).toBe(false);
    expect(canLateMove(row, new Date("2026-10-27T15:00:00Z"))).toBe(false);
  });
  it("is not offered for an unpaid booking", () => expect(canLateMove({ ...row, status: "offered" }, inside)).toBe(false));
});

describe("late reschedule once we are on the way", () => {
  it("is not offered", () => {
    const r = { status: "confirmed", source: "client", confirmed_date: "2026-10-27", confirmed_time: "10:00", policy_version: "v3-2026-11", late_reschedules: 0, en_route_at: "2026-10-27T13:00:00Z" };
    expect(canLateMove(r, new Date("2026-10-27T13:30:00Z"))).toBe(false);
  });
});
