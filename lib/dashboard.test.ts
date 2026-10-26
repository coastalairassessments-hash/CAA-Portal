import { describe, expect, it } from "vitest";
import { money, needsYou, nextUp, type DashRow } from "./dashboard";

const NOW = new Date("2026-10-26T17:00:00Z"); // Mon Oct 26, 1 PM Eastern
const base: DashRow = {
  id: "x", status: "confirmed", source: "client", issue: "musty_smell", name: "A",
  confirmed_date: "2026-10-26", confirmed_time: "10:00", deposit_cents: 51375, deposit_paid_at: "2026-10-20T14:00:00Z",
  arrived_at: null, left_at: null, lab_samples: null, extras_cents: 0, final_paid_at: null,
  final_invoice_no: null, cancel_refund: null, refunded_at: null,
};
const done = (o: Partial<DashRow>): DashRow => ({
  ...base, arrived_at: "2026-10-26T14:00:00Z", left_at: "2026-10-26T16:00:00Z", ...o, // 2 hours on site
});

describe("needsYou", () => {
  it("counts approvals, deposits, invoices to send and refunds", () => {
    const rows = [
      { ...base, id: "1", status: "new" },
      { ...base, id: "2", status: "offered" },
      { ...base, id: "3", status: "offered" },
      done({ id: "4" }),
      done({ id: "5", final_invoice_no: "1001" }),
      { ...base, id: "6", status: "cancelled", cancel_refund: true },
      { ...base, id: "7", status: "cancelled", cancel_refund: true, refunded_at: "2026-10-25T00:00:00Z" },
    ];
    expect(needsYou(rows)).toEqual({ approve: 1, deposits: 2, toInvoice: 1 + 0, refunds: 1 });
  });
});

describe("money", () => {
  it("sums deposits waiting using the stored deposit", () => {
    const rows = [{ ...base, status: "offered" }, { ...base, status: "offered", deposit_cents: null, issue: "post_remediation" }];
    expect(money(rows, NOW).depositsWaiting).toBe(51375 + 43125);
  });
  it("owed = final invoice minus the deposit, bucketed by age", () => {
    // 2 hr visit: 68500 + 4 quarters (19500) = 88000; minus 51375 deposit = 36625
    const fresh = done({ id: "a" });
    const old = done({ id: "b", left_at: "2026-10-05T16:00:00Z", arrived_at: "2026-10-05T14:00:00Z" });
    const m = money([fresh, old], NOW);
    expect(m.owed.total).toBe(36625 * 2);
    expect(m.owed.d0to7).toBe(36625);
    expect(m.owed.d15plus).toBe(36625);
  });
  it("a contractor job has no deposit to subtract", () => {
    const c = done({ source: "contractor", deposit_cents: null, deposit_paid_at: null, issue: "post_remediation" });
    expect(money([c], NOW).owed.total).toBe(57500 + 19500);
  });
  it("paid this month counts only this month, at the full invoice total", () => {
    const paid = done({ final_paid_at: "2026-10-22T15:00:00Z" });
    const last = done({ final_paid_at: "2026-09-28T15:00:00Z" });
    expect(money([paid, last], NOW).paidThisMonth).toBe(88000);
    expect(money([paid], NOW).owed.total).toBe(0);
  });
});

describe("nextUp", () => {
  it("is the earliest unfinished job today", () => {
    const rows = [
      done({ id: "finished", confirmed_time: "08:00" }),
      { ...base, id: "late", confirmed_time: "13:30" },
      { ...base, id: "early", confirmed_time: "10:00" },
      { ...base, id: "tomorrow", confirmed_date: "2026-10-27" },
    ];
    expect(nextUp(rows, NOW)?.id).toBe("early");
    expect(nextUp([], NOW)).toBeNull();
  });
});
