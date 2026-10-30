import { describe, expect, it } from "vitest";
import { bookingView, clientStep } from "./booking";

const base = { status: "new", issue: "musty_smell", preferred_date: "2026-11-10", preferred_time: "10:00", confirmed_date: null, confirmed_time: null, deposit_cents: null, left_at: null, final_paid_at: null };
describe("bookingView", () => {
  it("walks the client steps", () => {
    expect(clientStep(base)).toBe(1);
    expect(clientStep({ ...base, status: "offered" })).toBe(2);
    expect(clientStep({ ...base, status: "confirmed" })).toBe(3);
    expect(clientStep({ ...base, status: "confirmed", left_at: "x" })).toBe(4);
    expect(clientStep({ ...base, status: "confirmed", left_at: "x", final_paid_at: "y" })).toBe(5);
    expect(clientStep({ ...base, status: "cancelled" })).toBe(0);
  });
  it("explains a new request", () => {
    const v = bookingView(base);
    expect(v.headline).toBe("We received your request");
    expect(v.canCancel).toBe(true);
    expect(v.cancelNote).toContain("nothing to refund");
  });
  it("says the deposit comes back when far out, not when close", () => {
    const b = { ...base, status: "confirmed", confirmed_date: "2026-11-10", confirmed_time: "10:00" };
    expect(bookingView(b, new Date("2026-11-01T12:00:00Z")).cancelNote).toContain("refunded in full");
    expect(bookingView(b, new Date("2026-11-10T08:00:00Z")).cancelNote).toContain("not refunded");
  });
  it("offers no cancel once cancelled or visited", () => {
    expect(bookingView({ ...base, status: "cancelled" }).canCancel).toBe(false);
    expect(bookingView({ ...base, status: "confirmed", left_at: "x" }).canCancel).toBe(false);
  });
});
