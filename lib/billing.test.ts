import { describe, expect, it } from "vitest";
import { durationLabel, extraQuarterHours, finalInvoice, minutesOnSite } from "./billing";

describe("time on site", () => {
  it("measures minutes between arrive and leave", () => {
    expect(minutesOnSite("2026-10-27T14:00:00Z", "2026-10-27T15:50:00Z")).toBe(110);
    expect(minutesOnSite(null, "2026-10-27T15:50:00Z")).toBeNull();
    expect(minutesOnSite("2026-10-27T15:50:00Z", "2026-10-27T14:00:00Z")).toBeNull();
  });
  it("bills nothing extra up to an hour, then rounds up by 15 minutes", () => {
    expect(extraQuarterHours(30)).toBe(0);
    expect(extraQuarterHours(60)).toBe(0);
    expect(extraQuarterHours(61)).toBe(1);
    expect(extraQuarterHours(75)).toBe(1);
    expect(extraQuarterHours(76)).toBe(2);
    expect(extraQuarterHours(110)).toBe(4);
    expect(extraQuarterHours(120)).toBe(4);
  });
  it("labels durations", () => {
    expect(durationLabel(110)).toBe("1 hr 50 min");
    expect(durationLabel(120)).toBe("2 hr");
    expect(durationLabel(45)).toBe("45 min");
  });
});

describe("finalInvoice", () => {
  it("2 hr visit, 2 samples, deposit paid", () => {
    const f = finalInvoice({ issue: "musty_smell", minutes: 120, samples: 2, extrasCents: 0, depositPaidCents: 51375 });
    expect(f.quarters).toBe(4);
    expect(f.extraTime).toBe(19500);
    expect(f.samples).toBe(17000);
    expect(f.total).toBe(68500 + 19500 + 17000);
    expect(f.balance).toBe(f.total - 51375);
  });
  it("PRV, exactly one hour, no samples", () => {
    const f = finalInvoice({ issue: "post_remediation", minutes: 60, samples: null, extrasCents: 0, depositPaidCents: 43125 });
    expect(f.total).toBe(57500);
    expect(f.balance).toBe(14375);
  });
  it("no times yet means no extra time", () => {
    expect(finalInvoice({ issue: "musty_smell", minutes: null, samples: 0, extrasCents: 2500, depositPaidCents: null }).total).toBe(71000);
  });
});
