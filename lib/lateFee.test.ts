import { beforeEach, describe, expect, it, vi } from "vitest";

const sent: { to: string; subject: string; text: string }[] = [];
const created: { cents: number }[] = [];
const expired: string[] = [];
let paidNow = false;
vi.mock("./notify", () => ({ sendEmail: async (m: { to: string; subject: string; text: string }) => { sent.push(m); return { ok: true }; }, SITE_URL_FALLBACK: "https://x.test" }));
vi.mock("./stripePay", () => ({
  isStripeId: (id?: string | null) => !!id && id.startsWith("cs_"),
  getCheckout: async () => ({ paid: paidNow, expired: false, url: null, cents: 0 }),
  expireCheckout: async (id: string) => { expired.push(id); },
  createCheckout: async (o: { cents: number }) => { created.push(o); return { id: "cs_new", url: "https://pay" }; },
}));
vi.mock("./finalPay", () => ({ siteBase: () => "https://x.test" }));

import { sweepContractorFees } from "./lateFee";

type Row = Record<string, unknown>;
function fakeDb(jobs: Row[]) {
  const charges: Row[] = [];
  const db = {
    charges, jobs,
    from(table: string) {
      const ctx: { table: string; filters: ((r: Row) => boolean)[]; patch?: Row; op: string } = { table, filters: [], op: "select" };
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: (k: string, v: unknown) => { ctx.filters.push((r) => r[k] === v); return chain; },
        is: (k: string, v: unknown) => { ctx.filters.push((r) => (v === null ? r[k] == null : r[k] === v)); return chain; },
        not: (k: string) => { ctx.filters.push((r) => r[k] != null); return chain; },
        limit: () => chain,
        order: () => chain,
        update: (p: Row) => { ctx.op = "update"; ctx.patch = p; return chain; },
        insert: async (p: Row) => { if (table === "job_charges") charges.push(p); return { data: null }; },
        then: (res: (v: unknown) => void) => {
          if (table === "job_charges") return res({ data: charges.map((c, i) => ({ id: String(i), qty: 1, ...c })) });
          const hit = jobs.filter((r) => ctx.filters.every((f) => f(r)));
          if (ctx.op === "update") { hit.forEach((r) => Object.assign(r, ctx.patch)); return res({ data: hit.map((r) => ({ id: r.id })) }); }
          return res({ data: hit });
        },
      };
      return chain;
    },
  };
  return db;
}
const job = (over: Row = {}): Row => ({
  id: "11111111-aaaa-bbbb-cccc-000000000001", source: "contractor", status: "confirmed", trip_only: false, final_paid_at: null, late_fee_added_at: null,
  final_invoiced_at: "2026-11-01T15:00:00Z", issue: "post_remediation", arrived_at: "2026-11-01T14:00:00Z", left_at: "2026-11-01T15:00:00Z",
  lab_samples: 0, extras_cents: 0, deposit_paid_at: null, deposit_cents: null, qb_invoice_id: "cs_old", public_token: "a".repeat(32), address: "1 Main St", name: "Acme", confirmed_date: "2026-11-01",
  contractors: { name: "Acme", email: "a@acme.com", terms_accepted_at: "2026-10-01T00:00:00Z" }, ...over,
});
const at = (d: string) => new Date(`${d}T17:00:00Z`);

beforeEach(() => { sent.length = 0; created.length = 0; expired.length = 0; paidNow = false; });

describe("contractor late fee", () => {
  it("does nothing before day 25", async () => {
    const db = fakeDb([job()]);
    expect(await sweepContractorFees(db as never, at("2026-11-25"))).toEqual({ reminded: 0, fees: 0 });
    expect(sent).toHaveLength(0);
  });
  it("sends one reminder on day 25, not two", async () => {
    const db = fakeDb([job()]);
    expect(await sweepContractorFees(db as never, at("2026-11-26"))).toEqual({ reminded: 1, fees: 0 });
    expect(await sweepContractorFees(db as never, at("2026-11-27"))).toEqual({ reminded: 0, fees: 0 });
    expect(sent).toHaveLength(1);
    expect(sent[0].text).toContain("$250");
  });
  it("adds the $250 after day 30, replaces the card page, and emails the new total once", async () => {
    const db = fakeDb([job()]);
    expect(await sweepContractorFees(db as never, at("2026-12-02"))).toEqual({ reminded: 0, fees: 1 });
    expect(db.charges).toHaveLength(1);
    expect(db.charges[0]).toMatchObject({ unit_cents: 25000 });
    expect(expired).toEqual(["cs_old"]);
    expect(created[0].cents).toBe(57500 + 25000); // PRV first hour plus the fee
    expect(sent[0].subject).toContain("Administrative fee added");
    expect(await sweepContractorFees(db as never, at("2026-12-03"))).toEqual({ reminded: 0, fees: 0 });
    expect(db.charges).toHaveLength(1);
  });
  it("skips contractors who have not accepted the terms, trip-only and paid invoices", async () => {
    const db = fakeDb([
      job({ id: "a", contractors: { name: "N", email: "n@x.com", terms_accepted_at: null } }),
      job({ id: "b", trip_only: true }),
      job({ id: "c", final_paid_at: "2026-11-05T00:00:00Z" }),
    ]);
    expect(await sweepContractorFees(db as never, at("2026-12-20"))).toEqual({ reminded: 0, fees: 0 });
    expect(db.charges).toHaveLength(0);
  });
  it("never adds a fee when the card page was just paid", async () => {
    paidNow = true;
    const db = fakeDb([job()]);
    expect(await sweepContractorFees(db as never, at("2026-12-20"))).toEqual({ reminded: 0, fees: 0 });
    expect(db.charges).toHaveLength(0);
  });
});
