import { beforeEach, describe, expect, it, vi } from "vitest";

const getCheckout = vi.fn();
const sendReadyReports = vi.fn(async () => 1);
const sendEmail = vi.fn(async () => ({ ok: true }));
vi.mock("./stripePay", () => ({ getCheckout: (...a: unknown[]) => getCheckout(...a), isStripeId: (id?: string | null) => !!id && id.startsWith("cs_") }));
vi.mock("./reportServer", () => ({ sendReadyReports: (...a: unknown[]) => sendReadyReports(...(a as [])) }));
vi.mock("./notify", () => ({ sendEmail: (...a: unknown[]) => sendEmail(...(a as [])), SITE_URL_FALLBACK: "https://x.test" }));
vi.mock("./quicktexts", () => ({ GOOGLE_REVIEW_URL: "https://g.page/r", reviewEmail: () => ({ subject: "s", text: "t" }) }));

import { balanceLink, settleFinalPayment } from "./finalPay";

const row = { id: "1", name: "Pat Lee", email: "p@x.co", source: "client", public_token: "tok", qb_invoice_id: "cs_live_1", final_paid_at: null };
function db(updated: unknown[]) {
  return { from: () => ({ update: () => { const c: Record<string, unknown> = { eq: () => c, is: () => c, select: () => Promise.resolve({ data: updated }) }; return c; } }) } as never;
}
beforeEach(() => vi.clearAllMocks());

describe("balance paid by card", () => {
  it("records a paid balance, releases the report and thanks the client", async () => {
    getCheckout.mockResolvedValue({ paid: true });
    expect(await settleFinalPayment(db([{ id: "1" }]), row)).toBe(true);
    expect(sendReadyReports).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalled();
  });
  it("does nothing while unpaid, already paid, or not a card link", async () => {
    getCheckout.mockResolvedValue({ paid: false });
    expect(await settleFinalPayment(db([]), row)).toBe(false);
    expect(await settleFinalPayment(db([]), { ...row, final_paid_at: "2026-11-10" })).toBe(false);
    expect(await settleFinalPayment(db([]), { ...row, qb_invoice_id: "123" })).toBe(false);
    expect(sendReadyReports).not.toHaveBeenCalled();
  });
  it("does not repeat the thank-you if another run already recorded it", async () => {
    getCheckout.mockResolvedValue({ paid: true });
    expect(await settleFinalPayment(db([]), row)).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });
  it("uses the stable link when there is a booking token", () => {
    expect(balanceLink("tok", "https://stripe/x")).toMatch(/\/booking\/tok\/balance$/);
    expect(balanceLink(null, "https://stripe/x")).toBe("https://stripe/x");
  });
});
