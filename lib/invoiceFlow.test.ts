// End to end check of the "Send invoice" action with the outside world faked:
// it must email the client the right itemized amount with a working link, and say so.
import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = {};
const mail: { to: string; subject: string; text: string }[] = [];
const stripeCalls: { cents: number; email?: string }[] = [];
const expired: string[] = [];

function from(name: string) {
  const rows = () => (tables[name] ??= []);
  let filters: ((r: Row) => boolean)[] = [];
  let patch: Row | null = null;
  let mode: "select" | "update" | "insert" | "delete" = "select";
  const apply = () => rows().filter((r) => filters.every((f) => f(r)));
  const result = () => {
    if (mode === "update") { apply().forEach((r) => Object.assign(r, patch)); return { data: null, error: null }; }
    if (mode === "delete") { tables[name] = rows().filter((r) => !apply().includes(r)); return { data: null, error: null }; }
    return { data: apply(), error: null };
  };
  const q: Record<string, unknown> = {
    select: () => q,
    eq: (k: string, v: unknown) => { filters.push((r) => r[k] === v); return q; },
    in: () => q, is: () => q, order: () => q, limit: () => q,
    like: () => q,
    ilike: (k: string, v: string) => { filters.push((r) => String(r[k] ?? "").toLowerCase() === v.toLowerCase()); return q; },
    update: (p: Row) => { mode = "update"; patch = p; return q; },
    insert: (p: Row) => { const row = { id: `00000000-0000-4000-8000-${String(rows().length + 1).padStart(12, "0")}`, ...p }; rows().push(row); filters = [(r) => r === row]; return q; },
    delete: () => { mode = "delete"; return q; },
    single: async () => { const d = apply(); return { data: d[0] ?? null, error: d[0] ? null : { code: "PGRST116" } }; },
    maybeSingle: async () => ({ data: apply()[0] ?? null, error: null }),
    then: (res: (v: unknown) => unknown) => Promise.resolve(result()).then(res),
  };
  return q;
}

vi.mock("next/navigation", () => ({ redirect: (to: string) => { throw Object.assign(new Error("redirect"), { digest: `NEXT_REDIRECT;${to}` }); } }));
vi.mock("@/lib/supabase/server", () => ({
  supabaseForUser: async () => ({ auth: { getUser: async () => ({ data: { user: { id: "u" } } }) }, rpc: async () => ({ data: true }), from }),
}));
vi.mock("@/lib/notify", () => ({ SITE_URL_FALLBACK: "https://book.example.com", sendEmail: async (m: { to: string; subject: string; text: string }) => { mail.push(m); return { ok: true }; } }));
vi.mock("@/lib/stripePay", () => ({
  stripeConfigured: () => true,
  isStripeId: (id?: string | null) => !!id && id.startsWith("cs_"),
  createCheckout: async (o: { cents: number; email?: string }) => { stripeCalls.push(o); return { id: "cs_test_1", url: "https://stripe.example/pay" }; },
  expireCheckout: async (id: string) => { expired.push(id); },
}));
vi.mock("@/lib/finalPay", () => ({ siteBase: () => "https://book.example.com", balanceLink: (t: string) => `https://book.example.com/booking/${t}/balance` }));

async function send(id: string): Promise<string> {
  const { sendFinalInvoice } = await import("@/app/admin/actions");
  const form = new FormData();
  form.set("id", id);
  try { await sendFinalInvoice(form); } catch (e) { return String((e as { digest?: string }).digest ?? e); }
  return "no redirect";
}

const ID = "11111111-1111-4111-8111-111111111111";
beforeEach(() => {
  for (const k of Object.keys(tables)) delete tables[k];
  mail.length = 0; stripeCalls.length = 0; expired.length = 0;
  tables.requests = [{
    id: ID, status: "confirmed", source: "client", issue: "air_quality", name: "Pat Client", email: "pat@example.com",
    address: "1 Main St", public_token: "a".repeat(32), confirmed_date: "2026-11-10",
    arrived_at: "2026-11-10T17:30:00Z", left_at: "2026-11-10T18:30:00Z",
    deposit_cents: 51375, deposit_paid_at: "2026-11-01T12:00:00Z", extras_cents: 0, trip_only: false, final_paid_at: null, qb_invoice_id: null,
  }];
  tables.job_charges = [];
});

describe("send the balance", () => {
  it("emails the client the balance with a card link and records it", async () => {
    const to = await send(ID);
    expect(to).toContain(`/admin/${ID}?saved=invoice`);
    expect(stripeCalls).toEqual([expect.objectContaining({ cents: 17125, email: "pat@example.com" })]);
    expect(mail).toHaveLength(1);
    expect(mail[0].to).toBe("pat@example.com");
    expect(mail[0].text).toContain("$171.25");
    expect(mail[0].text).toContain(`/booking/${"a".repeat(32)}/balance`);
    expect(tables.requests[0].qb_invoice_id).toBe("cs_test_1");
    expect(tables.requests[0].final_invoiced_at).toBeTruthy();
  });

  it("bills the trip fee instead of the full price when not ready", async () => {
    Object.assign(tables.requests[0], { trip_only: true, extras_cents: 35000, deposit_cents: 10000 });
    tables.job_charges = [{ request_id: ID, kind: "trip", description: "Trip fee", qty: 1, unit_cents: 35000 }];
    await send(ID);
    expect(stripeCalls[0].cents).toBe(25000); // $350 trip fee minus the $100 deposit, not the full price
    expect(mail[0].text).toContain("trip fee");
  });

  it("tells you when nothing is owed", async () => {
    Object.assign(tables.requests[0], { deposit_cents: 99999 });
    expect(await send(ID)).toContain("error=nobalance");
    expect(mail).toHaveLength(0);
  });

  it("sends a contractor job to the contractor's email", async () => {
    Object.assign(tables.requests[0], { source: "contractor", contractor_id: "c1", email: null, deposit_cents: null, deposit_paid_at: null, reference: "PO-9" });
    tables.contractors = [{ id: "c1", email: "ops@contractor.com" }];
    await send(ID);
    expect(mail[0].to).toBe("ops@contractor.com");
    expect(mail[0].subject).toContain("Invoice CAA-20261110");
    expect(mail[0].text).toContain("PO-9");
    expect(mail[0].text).toContain(`/invoice/${"a".repeat(32)}`);
  });
});

describe("add a job that already happened", () => {
  it("saves it closed with the trip fee and a notes value the database accepts", async () => {
    const { addContractorJob } = await import("@/app/admin/actions");
    tables.contractors = [];
    tables.requests = [];
    const f = new FormData();
    Object.entries({ newName: "Acme Restoration", service: "prv", address: "9 Oak Ln, Stuart", date: "2026-11-12", time: "10:00", hours: "2", outcome: "trip", reference: "PO-7", notes: "", invoiceNote: "" }).forEach(([k, v]) => f.set(k, v));
    let to = "";
    try { await addContractorJob({ error: null }, f); } catch (e) { to = String((e as { digest?: string }).digest ?? e); }
    expect(to).toMatch(/\/admin\/[0-9a-f-]{36}\?closed=1/);
    const row = tables.requests[0];
    expect(typeof row.notes).toBe("string"); // the column is NOT NULL: null here broke every save once
    expect(row).toMatchObject({ source: "contractor", status: "confirmed", trip_only: true, reference: "PO-7" });
    expect(row.arrived_at && row.left_at).toBeTruthy();
    expect(tables.job_charges).toEqual([expect.objectContaining({ kind: "trip", unit_cents: 35000 })]);
    expect(tables.contractors[0]).toMatchObject({ name: "Acme Restoration" });
  });
});

describe("save and send invoice from Add", () => {
  const fill = (extra: Record<string, string>) => {
    const f = new FormData();
    Object.entries({ newName: "Bayside Remediation", service: "prv", address: "5 Harbor Rd, Jupiter", date: "2026-11-13", time: "10:00", hours: "1", outcome: "done", reference: "", notes: "", invoiceNote: "", ...extra }).forEach(([k, v]) => f.set(k, v));
    return f;
  };
  const run = async (f: FormData) => {
    const { addContractorJob } = await import("@/app/admin/actions");
    try { const r = await addContractorJob({ error: null }, f); return { error: r.error, to: "" }; } catch (e) { return { error: null, to: String((e as { digest?: string }).digest ?? e) }; }
  };
  beforeEach(() => { tables.contractors = []; tables.requests = []; tables.job_charges = []; });

  it("saves, closes and emails the contractor the invoice in one step", async () => {
    const r = await run(fill({ send: "1", email: "Billing@Bayside.com" }));
    expect(r.to).toMatch(/saved=invoice/);
    expect(tables.contractors[0]).toMatchObject({ name: "Bayside Remediation", email: "billing@bayside.com" });
    expect(mail).toHaveLength(1);
    expect(mail[0].to).toBe("billing@bayside.com");
    expect(mail[0].subject).toContain("Invoice CAA-20261113");
    expect(stripeCalls[0].cents).toBeGreaterThan(0);
    expect(tables.requests[0].qb_invoice_id).toBe("cs_test_1");
  });

  it("asks for the email instead of saving half a job", async () => {
    const r = await run(fill({ send: "1" }));
    expect(r.error).toContain("email");
    expect(tables.requests).toHaveLength(0);
    expect(mail).toHaveLength(0);
  });

  it("can save closed without sending", async () => {
    const r = await run(fill({}));
    expect(r.to).toMatch(/closed=1/);
    expect(mail).toHaveLength(0);
    expect(tables.requests[0].left_at).toBeTruthy();
  });
});

describe("the other buttons on a job", () => {
  const go = async (name: "markFinalPaid" | "cancelJob" | "saveVisitTimes", fields: Record<string, string>) => {
    const actions = await import("@/app/admin/actions");
    const f = new FormData();
    Object.entries(fields).forEach(([k, v]) => f.set(k, v));
    try { await actions[name](f); } catch (e) { return String((e as { digest?: string }).digest ?? e); }
    return "no redirect";
  };

  it("I was there: closes the job with the hours entered", async () => {
    Object.assign(tables.requests[0], { arrived_at: null, left_at: null, confirmed_time: "12:30" });
    const to = await go("saveVisitTimes", { id: ID, date: "2026-11-10", hours: "1.5", trip_present: "1" });
    expect(to).toContain("saved=time");
    expect(tables.requests[0].arrived_at && tables.requests[0].left_at).toBeTruthy();
    expect(tables.requests[0].trip_only).toBe(false);
  });

  it("I was there with the trip box ticked adds the trip fee", async () => {
    Object.assign(tables.requests[0], { arrived_at: null, left_at: null, confirmed_time: "12:30" });
    await go("saveVisitTimes", { id: ID, date: "2026-11-10", hours: "1", trip_present: "1", trip_only: "on" });
    expect(tables.requests[0].trip_only).toBe(true);
    expect(tables.job_charges).toEqual([expect.objectContaining({ kind: "trip" })]);
  });

  it("marking paid closes an open card page and confirms", async () => {
    tables.requests[0].qb_invoice_id = "cs_open_1";
    const to = await go("markFinalPaid", { id: ID });
    expect(to).toContain("saved=paid");
    expect(tables.requests[0].final_paid_at).toBeTruthy();
    expect(expired).toEqual(["cs_open_1"]);
  });

  it("cancelling a contractor job closes its open card page", async () => {
    tables.requests[0].qb_invoice_id = "cs_open_2";
    const to = await go("cancelJob", { id: ID });
    expect(to).toContain("/admin/today");
    expect(tables.requests[0].status).toBe("cancelled");
    expect(expired).toEqual(["cs_open_2"]);
  });

  it("will not cancel a job that is already paid", async () => {
    tables.requests[0].final_paid_at = "2026-11-12T00:00:00Z";
    expect(await go("cancelJob", { id: ID })).toContain("error=nodelete");
    expect(tables.requests[0].status).toBe("confirmed");
  });
});

describe("payment links", () => {
  const LID = "22222222-2222-4222-8222-222222222222";
  const call = async (name: "sendSavedLink" | "sendPaymentLink" | "deletePaymentLink", fields: Record<string, string>) => {
    const actions = await import("@/app/admin/links/actions");
    const f = new FormData();
    Object.entries(fields).forEach(([k, v]) => f.set(k, v));
    try { await actions[name](f); } catch (e) { return String((e as { digest?: string }).digest ?? e); }
    return "no redirect";
  };
  beforeEach(() => {
    tables.payment_links = [{ id: LID, token: "b".repeat(32), name: "Laura Baltadano", email: null, description: "Invoice #12995", amount_cents: 23500, stripe_id: null, sent_at: null, paid_at: null }];
  });

  it("a saved link needs an email, then sends with the right amount", async () => {
    expect(await call("sendSavedLink", { id: LID, email: "" })).toContain("error=");
    expect(mail).toHaveLength(0);
    expect(await call("sendSavedLink", { id: LID, email: "Laura@Example.com" })).toContain("sent=1");
    expect(mail[0].to).toBe("laura@example.com");
    expect(mail[0].text).toContain("$235.00");
    expect(mail[0].text).toContain(`/pay/${"b".repeat(32)}`);
    expect(stripeCalls[0].cents).toBe(23500);
    expect(tables.payment_links[0]).toMatchObject({ stripe_id: "cs_test_1", email: "laura@example.com" });
    expect(tables.payment_links[0].sent_at).toBeTruthy();
  });

  it("save without sending keeps it as a draft", async () => {
    tables.payment_links = [];
    const to = await call("sendPaymentLink", { name: "New Client", email: "", description: "Old balance", amount: "100", then: "draft" });
    expect(to).toContain("saved=1");
    expect(mail).toHaveLength(0);
    expect(tables.payment_links[0]).toMatchObject({ name: "New Client", amount_cents: 10000 });
  });

  it("cancelling an unpaid link closes its card page", async () => {
    Object.assign(tables.payment_links[0], { stripe_id: "cs_open_3", sent_at: "2026-11-14T00:00:00Z" });
    await call("deletePaymentLink", { id: LID });
    expect(expired).toEqual(["cs_open_3"]);
    expect(tables.payment_links).toHaveLength(0);
  });
});
