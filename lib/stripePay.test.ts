import { afterEach, describe, expect, it, vi } from "vitest";
import { checkoutForm, checkoutPaid, createCheckout, isStripeId } from "./stripePay";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("stripe checkout", () => {
  it("tells Stripe ids from invoice ids", () => {
    expect(isStripeId("cs_live_abc")).toBe(true);
    expect(isStripeId("1234")).toBe(false);
    expect(isStripeId(null)).toBe(false);
  });
  it("builds the form in cents and returns to the booking page", () => {
    const f = checkoutForm({ cents: 51375, description: "Deposit", email: "a@b.co", requestId: "r1", successUrl: "https://x/b/t", cancelUrl: "https://x/b/t" });
    expect(f.get("line_items[0][price_data][unit_amount]")).toBe("51375");
    expect(f.get("mode")).toBe("payment");
    expect(f.get("success_url")).toBe("https://x/b/t");
    expect(f.get("metadata[request_id]")).toBe("r1");
  });
  it("creates a session and reads whether it was paid", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_x");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "cs_1", url: "https://pay" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ payment_status: "paid", status: "complete" }) });
    vi.stubGlobal("fetch", fetchMock);
    expect(await createCheckout({ cents: 100, description: "d", successUrl: "u", cancelUrl: "u" })).toEqual({ id: "cs_1", url: "https://pay" });
    expect(await checkoutPaid("cs_1")).toEqual({ paid: true, expired: false });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer sk_test_x");
  });
  it("fails clearly when the key is missing", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    await expect(checkoutPaid("cs_1")).rejects.toThrow(/not set up/);
  });
});
