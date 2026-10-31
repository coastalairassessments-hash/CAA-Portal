import { describe, expect, it } from "vitest";
import { stageDone } from "./stage";

const base = { status: "new", source: "client", left_at: null, final_invoice_no: null, final_paid_at: null };
describe("stageDone", () => {
  it("walks the steps", () => {
    expect(stageDone(base)).toBe(1);
    expect(stageDone({ ...base, status: "offered" })).toBe(1);
    expect(stageDone({ ...base, status: "confirmed" })).toBe(2);
    expect(stageDone({ ...base, status: "confirmed", left_at: "x" })).toBe(3);
    expect(stageDone({ ...base, status: "confirmed", left_at: "x", final_invoice_no: "1" })).toBe(4);
    expect(stageDone({ ...base, status: "confirmed", left_at: "x", final_invoice_no: "1", final_paid_at: "y" })).toBe(5);
  });
  it("shows nothing when cancelled", () => {
    expect(stageDone({ ...base, status: "cancelled" })).toBe(0);
  });
});

import { ago, progress } from "./stage";
const NOW = new Date("2026-11-02T16:00:00Z");
const P = { status: "new", source: "client", created_at: "2026-11-02T15:00:00Z", left_at: null, final_invoice_no: null, final_paid_at: null, confirmed_date: null, confirmed_time: null };
describe("progress", () => {
  it("flags what needs Cory", () => {
    expect(progress(P, "2026-11-02", NOW)).toMatchObject({ label: "New request", warn: true, alive: true });
    expect(progress({ ...P, status: "offered", booking_mode: "instant" }, "2026-11-02", NOW)).toMatchObject({ label: "Paying deposit", warn: false });
    expect(progress({ ...P, status: "offered" }, "2026-11-02", NOW)).toMatchObject({ label: "Deposit waiting", warn: true });
  });
  it("walks a booked job through the visit", () => {
    const b = { ...P, status: "confirmed", confirmed_date: "2026-11-05", confirmed_time: "12:30" };
    expect(progress(b, "2026-11-02", NOW)).toMatchObject({ label: "Booked", warn: false });
    expect(progress(b, "2026-11-05", NOW).label).toBe("Today");
    expect(progress({ ...b, en_route_at: "x" }, "2026-11-05", NOW).label).toBe("On the way");
    expect(progress({ ...b, en_route_at: "x", arrived_at: "x" }, "2026-11-05", NOW).label).toBe("On site");
  });
  it("chases money after the visit", () => {
    const v = { ...P, status: "confirmed", left_at: "2026-10-20T15:00:00Z" };
    expect(progress(v, "2026-11-02", NOW)).toMatchObject({ label: "Send invoice", warn: true });
    expect(progress({ ...v, final_invoice_no: "9" }, "2026-11-02", NOW)).toMatchObject({ label: "Invoiced, unpaid", warn: true });
    expect(progress({ ...v, final_invoice_no: "9", left_at: "2026-11-01T15:00:00Z" }, "2026-11-02", NOW).warn).toBe(false);
    expect(progress({ ...v, final_paid_at: "y" }, "2026-11-02", NOW)).toMatchObject({ label: "Paid", alive: false });
  });
  it("handles refunds and closed jobs", () => {
    expect(progress({ ...P, status: "cancelled", cancel_refund: true }, "2026-11-02", NOW)).toMatchObject({ label: "Refund due", warn: true });
    expect(progress({ ...P, status: "cancelled", cancel_refund: true, refunded_at: "x" }, "2026-11-02", NOW).alive).toBe(false);
    expect(progress({ ...P, status: "declined" }, "2026-11-02", NOW).alive).toBe(false);
  });
  it("says how long ago", () => {
    expect(ago("2026-11-02T15:59:00Z", NOW)).toBe("just now");
    expect(ago("2026-11-02T15:30:00Z", NOW)).toBe("30 min ago");
    expect(ago("2026-11-02T12:00:00Z", NOW)).toBe("4 hr ago");
    expect(ago("2026-10-31T16:00:00Z", NOW)).toBe("2 days ago");
  });
});
