import { describe, expect, it } from "vitest";
import { paymentLinkEmail, parsePaymentLink } from "./paymentLink";

describe("payment link", () => {
  it("parses dollars into cents", () => {
    const r = parsePaymentLink({ name: " Reid Price ", email: "R@X.com", description: "Invoice #12979", amount: "$1,035.50" });
    expect(r.data).toEqual({ name: "Reid Price", email: "r@x.com", description: "Invoice #12979", amount_cents: 103550 });
  });
  it("rejects bad input", () => {
    expect(parsePaymentLink({ name: "A", email: "nope", description: "x", amount: "5" }).success).toBe(false);
    expect(parsePaymentLink({ name: "A", email: "a@b.co", description: "x", amount: "0" }).success).toBe(false);
  });
  it("writes the email", () => {
    const m = paymentLinkEmail({ name: "Reid Price", description: "Invoice #12979", cents: 35000, link: "https://x/pay/abc" });
    expect(m.text).toContain("Hi Reid,");
    expect(m.text).toContain("$350.00");
    expect(m.text).toContain("https://x/pay/abc");
  });
});
