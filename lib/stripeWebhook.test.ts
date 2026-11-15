import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

const getCheckout = vi.fn();
const settleDeposit = vi.fn();
const settleFinalPayment = vi.fn();
vi.mock("./stripePay", () => ({ getCheckout: (...a: unknown[]) => getCheckout(...a) }));
vi.mock("./settle", () => ({ SETTLE_COLUMNS: "id", settleDeposit: (...a: unknown[]) => settleDeposit(...a) }));
vi.mock("./finalPay", () => ({ settleFinalPayment: (...a: unknown[]) => settleFinalPayment(...a) }));

import { handleStripeEvent, verifyStripeSignature } from "./stripeWebhook";

afterEach(() => vi.clearAllMocks());

const sign = (raw: string, secret: string, t: number) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex")}`;

describe("stripe signature", () => {
  const raw = '{"a":1}';
  it("accepts a good signature", () => {
    expect(verifyStripeSignature(raw, sign(raw, "whsec_x", 1000), "whsec_x", 1000)).toBe(true);
  });
  it("rejects a wrong secret, a changed body, an old timestamp, junk and a missing header", () => {
    expect(verifyStripeSignature(raw, sign(raw, "other", 1000), "whsec_x", 1000)).toBe(false);
    expect(verifyStripeSignature(raw + " ", sign(raw, "whsec_x", 1000), "whsec_x", 1000)).toBe(false);
    expect(verifyStripeSignature(raw, sign(raw, "whsec_x", 1000), "whsec_x", 2000)).toBe(false);
    expect(verifyStripeSignature(raw, "t=1000,v1=zzz", "whsec_x", 1000)).toBe(false);
    expect(verifyStripeSignature(raw, null, "whsec_x", 1000)).toBe(false);
    expect(verifyStripeSignature(raw, sign(raw, "whsec_x", 1000), "", 1000)).toBe(false);
  });
});

// A tiny fake of the Supabase calls the handler makes.
function fakeDb(tables: Record<string, { match: string; row: Record<string, unknown> | null }>) {
  return {
    from(table: string) {
      const t = tables[table];
      const chain: Record<string, unknown> = {
        select: () => chain, eq: () => chain, is: () => chain, update: () => chain,
        maybeSingle: async () => ({ data: t?.row ?? null }),
        then: (res: (v: unknown) => void) => res({ data: t?.row ? [{ id: "1" }] : [] }),
      };
      return chain;
    },
  } as never;
}
const ev = (type: string, id = "cs_1") => ({ type, data: { object: { id } } });

describe("stripe events", () => {
  it("ignores other events and non-checkout ids", async () => {
    expect(await handleStripeEvent(fakeDb({}), ev("charge.refunded"))).toBe("ignored");
    expect(await handleStripeEvent(fakeDb({}), ev("checkout.session.completed", "pi_1"))).toBe("ignored");
    expect(getCheckout).not.toHaveBeenCalled();
  });
  it("records nothing when Stripe says it is not paid", async () => {
    getCheckout.mockResolvedValue({ paid: false });
    expect(await handleStripeEvent(fakeDb({ requests: { match: "", row: { id: "r" } } }), ev("checkout.session.completed"))).toBe("waiting");
    expect(settleDeposit).not.toHaveBeenCalled();
  });
  it("books a paid deposit", async () => {
    getCheckout.mockResolvedValue({ paid: true });
    settleDeposit.mockResolvedValue("paid");
    expect(await handleStripeEvent(fakeDb({ requests: { match: "", row: { id: "r" } } }), ev("checkout.session.completed"))).toBe("deposit");
  });
  it("marks a payment link paid when no job matches", async () => {
    getCheckout.mockResolvedValue({ paid: true });
    expect(await handleStripeEvent(fakeDb({ payment_links: { match: "", row: { id: "l" } } }), ev("checkout.session.async_payment_succeeded"))).toBe("link");
  });
});
