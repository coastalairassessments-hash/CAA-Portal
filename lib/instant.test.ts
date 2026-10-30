import { describe, expect, it } from "vitest";
import { GIVE_UP_MINUTES, HOLD_MINUTES, canBookInstantly, holdAbandoned, holdActive, hoursFor } from "./instant";

const at = (min: number) => new Date(new Date("2026-11-03T15:00:00Z").getTime() + min * 60000);
const row = { status: "offered", booking_mode: "instant", offered_at: "2026-11-03T15:00:00Z" };

describe("instant booking rules", () => {
  it("plans visit length from size", () => {
    expect(hoursFor("musty_smell", "under_2000")).toBe(1);
    expect(hoursFor("musty_smell", "2000_4000")).toBe(3);
    expect(hoursFor("water_damage", "4000_6000")).toBe(4);
    expect(hoursFor("consultation", "4000_6000")).toBe(1);
  });
  it("sends bigger or outside jobs to a request", () => {
    expect(canBookInstantly({ area: "core", propertyType: "single_family", sizeBand: "under_2000" })).toBe(true);
    expect(canBookInstantly({ area: "core", propertyType: "condo", sizeBand: "2000_4000" })).toBe(true);
    expect(canBookInstantly({ area: "outside", propertyType: "single_family", sizeBand: "under_2000" })).toBe(false);
    expect(canBookInstantly({ area: "core", propertyType: "commercial", sizeBand: "under_2000" })).toBe(false);
    expect(canBookInstantly({ area: "core", propertyType: "single_family", sizeBand: "over_6000" })).toBe(false);
    expect(canBookInstantly({ area: "core", sizeBand: "under_2000" })).toBe(false);
  });
  it("holds a time only while the hold lasts", () => {
    expect(holdActive(row, at(HOLD_MINUTES - 1))).toBe(true);
    expect(holdActive(row, at(HOLD_MINUTES))).toBe(false);
    expect(holdActive({ ...row, booking_mode: "request" }, at(1))).toBe(false);
    expect(holdActive({ ...row, status: "confirmed" }, at(1))).toBe(false);
  });
  it("gives up on an unpaid booking after a while", () => {
    expect(holdAbandoned(row, at(GIVE_UP_MINUTES - 1))).toBe(false);
    expect(holdAbandoned(row, at(GIVE_UP_MINUTES))).toBe(true);
  });
});

import { submitRequest, type SubmitDeps } from "./submit";
import { bookingView } from "./booking";
import { vi } from "vitest";

const NOW = new Date("2026-10-25T17:00:00Z");
const form = {
  clientType: "homeowner", propertyType: "single_family", issue: "musty_smell", sizeBand: "under_2000",
  preferredDate: "2026-10-27", preferredTime: "10:00", name: "Pat Lee", phone: "772-555-0142",
  email: "pat@example.com", address: "1 Main St", city: "Stuart", zip: "34994", textConsent: true, termsAccepted: true,
};
const deps = (o: Partial<SubmitDeps> = {}): SubmitDeps => ({
  ipSalt: "s", now: () => NOW,
  countRecentByIp: vi.fn(async () => 0),
  insert: vi.fn(async () => ({ id: "id-1", public_token: "tok" })),
  notify: vi.fn(async () => {}),
  slotHeld: vi.fn(async () => false),
  startPayment: vi.fn(async () => {}),
  revertToRequest: vi.fn(async () => {}),
  ...o,
});

describe("submit with instant booking", () => {
  it("holds the time and starts payment, without alerting yet", async () => {
    const d = deps();
    const r = await submitRequest(form, "1.2.3.4", d);
    expect(r).toEqual({ ok: true, instant: true, token: "tok" });
    const row = (d.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(row).toMatchObject({ status: "offered", booking_mode: "instant", confirmed_time: "10:00", block_hours: 1, deposit_cents: 51375 });
    expect(d.notify).not.toHaveBeenCalled();
  });
  it("says the time was taken instead of saving", async () => {
    const d = deps({ slotHeld: vi.fn(async () => true) });
    const r = await submitRequest(form, null, d);
    expect(r).toMatchObject({ ok: false, status: 409 });
    expect(d.insert).not.toHaveBeenCalled();
  });
  it("falls back to a normal request when payments are down", async () => {
    const d = deps({ startPayment: vi.fn(async () => { throw new Error("QuickBooks is not connected"); }) });
    const r = await submitRequest(form, null, d);
    expect(r).toEqual({ ok: true });
    expect(d.revertToRequest).toHaveBeenCalledWith("id-1");
    expect(d.notify).toHaveBeenCalled();
  });
  it("keeps apartment buildings and big homes as requests", async () => {
    const d = deps();
    const r = await submitRequest({ ...form, propertyType: "multifamily" }, null, d);
    expect(r).toEqual({ ok: true });
    expect(d.startPayment).not.toHaveBeenCalled();
    const big = await submitRequest({ ...form, sizeBand: "over_6000" }, null, deps());
    expect(big).toEqual({ ok: true });
  });
});

describe("booking page while paying", () => {
  const base = { status: "offered", booking_mode: "instant", offered_at: "2026-10-25T17:00:00Z", issue: "musty_smell", preferred_date: "2026-10-27", preferred_time: "10:00", confirmed_date: "2026-10-27", confirmed_time: "10:00", deposit_cents: 51375, left_at: null, final_paid_at: null };
  it("asks for the deposit while held, and says when the hold ends", () => {
    const v = bookingView(base, new Date("2026-10-25T17:05:00Z"));
    expect(v.headline).toContain("Pay your deposit");
    expect(v.paying).toBe(true);
  });
  it("tells them when the hold ended", () => {
    const v = bookingView(base, new Date("2026-10-25T17:20:00Z"));
    expect(v.headline).toBe("Your hold ended");
    expect(v.expired).toBe(true);
  });
});
