import { beforeEach, describe, expect, it, vi } from "vitest";

const getInvoice = vi.fn();
const voidInvoice = vi.fn(async () => true);
const sendEmail = vi.fn(async () => ({ ok: true }));
const sendPush = vi.fn(async () => 1);
vi.mock("./qbSync", () => ({ getInvoice: (...a: unknown[]) => getInvoice(...a), voidInvoice: (...a: unknown[]) => voidInvoice(...(a as [])) }));
vi.mock("./notify", () => ({ sendEmail: (...a: unknown[]) => sendEmail(...(a as [])), SITE_URL_FALLBACK: "https://x.test" }));
vi.mock("./push", () => ({ sendPush: (...a: unknown[]) => sendPush(...(a as [])) }));

import { settleDeposit } from "./settle";

// A tiny stand-in for the database: every update reports the result we set.
function fakeDb(results: { data?: unknown[]; error?: { code: string } | null }[]) {
  const calls: unknown[] = [];
  const db = {
    from: () => ({
      update: (patch: unknown) => {
        calls.push(patch);
        const chain: Record<string, unknown> = {
          eq: () => chain,
          select: () => Promise.resolve(results.shift() ?? { data: [], error: null }),
        };
        return chain;
      },
    }),
  };
  return { db: db as never, calls };
}

const row = {
  id: "id-1", status: "offered", booking_mode: "instant", offered_at: "2026-11-03T15:00:00Z", qb_deposit_invoice_id: "inv-1",
  name: "Pat Lee", email: "pat@example.com", phone: "+17725550142", address: "1 Main", city: "Stuart", zip: "34994", public_token: "tok",
  confirmed_date: "2026-11-10", confirmed_time: "10:00:00", block_hours: 1,
};
const soon = new Date("2026-11-03T15:05:00Z");

beforeEach(() => { vi.clearAllMocks(); });

describe("settleDeposit", () => {
  it("does nothing for a job that is not an unpaid instant booking", async () => {
    const { db } = fakeDb([]);
    expect(await settleDeposit(db, { ...row, status: "confirmed" }, soon)).toBe("skip");
    expect(getInvoice).not.toHaveBeenCalled();
  });
  it("keeps waiting while the invoice is unpaid", async () => {
    getInvoice.mockResolvedValue({ balance: 513.75, link: null, syncToken: "0" });
    const { db, calls } = fakeDb([]);
    expect(await settleDeposit(db, row, soon)).toBe("waiting");
    expect(calls).toHaveLength(0);
  });
  it("books the time, emails the client and pings Cory once paid", async () => {
    getInvoice.mockResolvedValue({ balance: 0, link: null, syncToken: "1" });
    const { db, calls } = fakeDb([{ data: [{ id: "id-1" }], error: null }]);
    expect(await settleDeposit(db, row, soon)).toBe("paid");
    expect(calls[0]).toMatchObject({ status: "confirmed" });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendPush).toHaveBeenCalledTimes(1);
  });
  it("does not book twice when another check got there first", async () => {
    getInvoice.mockResolvedValue({ balance: 0, link: null, syncToken: "1" });
    const { db } = fakeDb([{ data: [], error: null }]);
    expect(await settleDeposit(db, row, soon)).toBe("skip");
    expect(sendEmail).not.toHaveBeenCalled();
  });
  it("refunds when the time was taken before they paid", async () => {
    getInvoice.mockResolvedValue({ balance: 0, link: null, syncToken: "1" });
    const { db, calls } = fakeDb([{ data: null as never, error: { code: "23P01" } }, { data: [{ id: "id-1" }], error: null }]);
    expect(await settleDeposit(db, row, soon)).toBe("taken");
    expect(calls[1]).toMatchObject({ status: "cancelled", cancel_refund: true });
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });
  it("frees the time and voids the invoice when nobody pays", async () => {
    getInvoice.mockResolvedValue({ balance: 513.75, link: null, syncToken: "0" });
    const { db } = fakeDb([{ data: [{ id: "id-1" }], error: null }]);
    expect(await settleDeposit(db, row, new Date("2026-11-03T16:00:00Z"))).toBe("abandoned");
    expect(voidInvoice).toHaveBeenCalledWith("inv-1");
  });
});
