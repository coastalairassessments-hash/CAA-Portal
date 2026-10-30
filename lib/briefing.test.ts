import { describe, expect, it } from "vitest";
import { buildBriefing, waitingLines } from "./briefing";

const job = (t: string, name: string) => ({ confirmed_time: t, name, issue: "musty_smell", address: "1 Main St", city: "Stuart", block_hours: 2 });
const none = { approve: 0, deposits: 0, toInvoice: 0, refunds: 0 };

describe("briefing", () => {
  it("counts and orders inspections", () => {
    const b = buildBriefing("today", "2026-11-03", [job("12:30", "Bea"), job("10:00", "Al")], none);
    expect(b.subject).toBe("Today: 2 inspections, first at 10:00 AM");
    expect(b.text.indexOf("Al")).toBeLessThan(b.text.indexOf("Bea"));
  });
  it("says so when nothing is booked", () => {
    const b = buildBriefing("tomorrow", "2026-11-03", [], none);
    expect(b.subject).toBe("Tomorrow: no inspections");
    expect(b.empty).toBe(true);
  });
  it("lists what is waiting", () => {
    expect(waitingLines({ approve: 1, deposits: 2, toInvoice: 0, refunds: 1 })).toEqual([
      "1 new request to approve", "2 deposits waiting", "1 refund to issue",
    ]);
  });
});
