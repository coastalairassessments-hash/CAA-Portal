import { describe, expect, it } from "vitest";
import { TRIP_FEE_CENTS, chargeCents, parseCharge, sumCharges } from "./charges";
import { balanceLines } from "./balanceText";
import { finalInvoice } from "./billing";

const id = "11111111-1111-4111-8111-111111111111";

describe("charges", () => {
  it("adds quantities times price", () => {
    expect(chargeCents({ qty: 3, unit_cents: 8500 })).toBe(25500);
    expect(sumCharges([{ qty: 3, unit_cents: 8500 }, { qty: 1, unit_cents: 35000 }])).toBe(60500);
  });
  it("fills in a sample and a trip fee from presets", () => {
    const s = parseCharge({ id, preset: "sample", qty: "2", description: "", price: "" });
    expect(s.success && s.data).toMatchObject({ kind: "material", description: "Lab sample", qty: 2, unit_cents: 8500 });
    const t = parseCharge({ id, preset: "trip", qty: "5", description: "", price: "" });
    expect(t.success && t.data).toMatchObject({ kind: "trip", qty: 1, unit_cents: TRIP_FEE_CENTS });
  });
  it("lets a price be overridden and needs details for something else", () => {
    const t = parseCharge({ id, preset: "trip", qty: "1", description: "", price: "175" });
    expect(t.success && t.data.unit_cents).toBe(17500);
    expect(parseCharge({ id, preset: "other", qty: "1", description: "", price: "20" }).success).toBe(false);
    expect(parseCharge({ id, preset: "other", qty: "1", description: "Dehumidifier rental", price: "" }).success).toBe(false);
    expect(parseCharge({ id, preset: "other", qty: "1", description: "Dehumidifier rental", price: "$40.50" }).success).toBe(true);
    expect(parseCharge({ id, preset: "sample", qty: "0", description: "", price: "" }).success).toBe(false);
  });
});

describe("trip-only billing", () => {
  const base = { issue: "air_quality", minutes: 150, samples: 3, extrasCents: TRIP_FEE_CENTS };
  it("bills only the trip fee, ignoring the first hour, extra time and old sample counts", () => {
    const inv = finalInvoice({ ...base, depositPaidCents: 51375, tripOnly: true });
    expect(inv.total).toBe(TRIP_FEE_CENTS);
    expect(inv.firstHour).toBe(0);
    expect(inv.balance).toBe(TRIP_FEE_CENTS - 51375); // negative means a refund is due
  });
  it("bills the full price with charges added when the job went ahead", () => {
    const inv = finalInvoice({ ...base, extrasCents: 25500, depositPaidCents: 51375 });
    expect(inv.total).toBe(inv.firstHour + inv.extraTime + inv.samples + 25500);
  });
  it("writes itemized lines a client can follow", () => {
    const inv = finalInvoice({ issue: "air_quality", minutes: 90, samples: null, extrasCents: 17000, depositPaidCents: 51375 });
    const lines = balanceLines({ inv, tripOnly: false, service: "Air quality", charges: [{ id: "1", kind: "material", description: "Lab sample", qty: 2, unit_cents: 8500 }], legacySamples: 0 });
    expect(lines[0]).toContain("first hour");
    expect(lines.some((l) => l.startsWith("Lab sample (2 x"))).toBe(true);
    expect(lines.at(-1)).toMatch(/^Balance due: /);
    const trip = balanceLines({ inv: finalInvoice({ ...base, depositPaidCents: null, tripOnly: true }), tripOnly: true, service: "Air quality", charges: [{ id: "2", kind: "trip", description: "Trip fee", qty: 1, unit_cents: TRIP_FEE_CENTS }], legacySamples: 0 });
    expect(trip[0]).toBe("Trip fee: $350.00");
    expect(trip.some((l) => l.includes("first hour"))).toBe(false);
  });
});
