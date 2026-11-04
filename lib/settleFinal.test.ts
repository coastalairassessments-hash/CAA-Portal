import { beforeEach, describe, expect, it, vi } from "vitest";

const getInvoice = vi.fn();
const sendReadyReports = vi.fn(async () => 1);
const sendEmail = vi.fn(async () => ({ ok: true }));
vi.mock("./qbSync", () => ({ getInvoice: (...a: unknown[]) => getInvoice(...a) }));
vi.mock("./reportServer", () => ({ sendReadyReports: (...a: unknown[]) => sendReadyReports(...(a as [])) }));
vi.mock("./notify", () => ({ SITE_URL_FALLBACK: "https://x.test", sendEmail: (...a: unknown[]) => sendEmail(...(a as [])) }));
vi.mock("./quicktexts", () => ({ GOOGLE_REVIEW_URL: "https://g.page/r/x", reviewEmail: () => ({ subject: "s", text: "t" }) }));

import { settleFinal } from "./settleFinal";

// A stand-in database: update().eq().is().select() resolves to the rows "changed".
const fakeDb = (changed: number) => {
  const updates: unknown[] = [];
  const chain: Record<string, unknown> = {};
  chain.update = (v: unknown) => { updates.push(v); return chain; };
  chain.eq = () => chain;
  chain.is = () => chain;
  chain.select = async () => ({ data: Array.from({ length: changed }, () => ({ id: "1" })) });
  return { db: { from: () => chain } as never, updates };
};
const job = { id: "1", name: "Dana Lee", email: "d@x.test", source: "client", qb_invoice_id: "55", final_paid_at: null };

beforeEach(() => { vi.clearAllMocks(); });

describe("settleFinal", () => {
  it("skips a job with no invoice or already paid", async () => {
    const { db } = fakeDb(1);
    expect(await settleFinal(db, { ...job, qb_invoice_id: null })).toBe("skip");
    expect(await settleFinal(db, { ...job, final_paid_at: "2026-11-01" })).toBe("skip");
    expect(getInvoice).not.toHaveBeenCalled();
  });
  it("waits while any balance is owed (a partial payment is not paid)", async () => {
    getInvoice.mockResolvedValue({ balance: 25 });
    const { db, updates } = fakeDb(1);
    expect(await settleFinal(db, job)).toBe("waiting");
    expect(updates).toHaveLength(0);
    expect(sendReadyReports).not.toHaveBeenCalled();
  });
  it("waits when QuickBooks cannot be reached", async () => {
    getInvoice.mockRejectedValue(new Error("down"));
    const { db } = fakeDb(1);
    expect(await settleFinal(db, job)).toBe("waiting");
  });
  it("marks paid, sends the report and the review note once", async () => {
    getInvoice.mockResolvedValue({ balance: 0 });
    const { db, updates } = fakeDb(1);
    expect(await settleFinal(db, job)).toBe("paid");
    expect(updates).toHaveLength(1);
    expect(sendReadyReports).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
  it("does nothing more when another run already marked it paid", async () => {
    getInvoice.mockResolvedValue({ balance: 0 });
    const { db } = fakeDb(0);
    expect(await settleFinal(db, job)).toBe("skip");
    expect(sendReadyReports).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
