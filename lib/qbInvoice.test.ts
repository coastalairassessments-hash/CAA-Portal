import { describe, expect, it } from "vitest";
import { finalInvoice } from "./billing";
import { customerPayload, finalInvoicePayload, qbEscape } from "./qbInvoice";

describe("quickbooks customer", () => {
  it("carries only what we know", () => {
    expect(customerPayload({ name: " Pat Lee " })).toEqual({ DisplayName: "Pat Lee" });
    const c = customerPayload({ name: "Pat", email: "p@x.com", phone: "+17725550100", address: "1 Main", city: "Stuart", zip: "34994" });
    expect(c.PrimaryEmailAddr).toEqual({ Address: "p@x.com" });
    expect(c.BillAddr).toMatchObject({ Line1: "1 Main", City: "Stuart", PostalCode: "34994" });
  });
  it("escapes quotes in lookups", () => {
    expect(qbEscape("O'Brien")).toBe("O\\'Brien");
  });
});

describe("final invoice payload", () => {
  it("lists first hour, extra time, samples and nets the deposit", () => {
    const inv = finalInvoice({ issue: "musty_smell", minutes: 135, samples: 2, extrasCents: 0, depositPaidCents: 51375 });
    const p = finalInvoicePayload({
      customerId: "9", itemId: "3", service: "Mold and air quality assessment", inv,
      quarterMinutes: inv.quarters * 15, samples: 2, email: "p@x.com", txnDate: "2026-10-27", dueDate: "2026-10-27",
    });
    const amounts = p.Line.map((l) => l.Amount);
    expect(amounts).toEqual([685, 243.75, 170, -513.75]);
    expect(amounts.reduce((a, b) => a + b, 0)).toBeCloseTo(inv.balance / 100, 2);
    expect(p.Line[1].Description).toContain("75 min");
    expect(p.BillEmail).toEqual({ Address: "p@x.com" });
  });
  it("skips empty lines for a contractor with no deposit", () => {
    const inv = finalInvoice({ issue: "post_remediation", minutes: 60, samples: null, extrasCents: 0, depositPaidCents: null });
    const p = finalInvoicePayload({
      customerId: "9", itemId: "3", service: "PRV", inv, quarterMinutes: 0, samples: 0, txnDate: "2026-10-27", dueDate: "2026-11-03",
    });
    expect(p.Line).toHaveLength(1);
    expect(p.Line[0].Amount).toBe(575);
    expect("BillEmail" in p).toBe(false);
    expect(p.DueDate).toBe("2026-11-03");
  });
});

import { depositInvoicePayload, readInvoice } from "./qbInvoice";
describe("deposit invoice", () => {
  it("builds a payable one-line invoice", () => {
    const p = depositInvoicePayload({ customerId: "7", itemId: "9", description: "Deposit to hold Tue, Nov 3 at 10:00 AM", cents: 51375, email: "a@b.co", txnDate: "2026-11-01" });
    expect(p.Line).toHaveLength(1);
    expect(p.Line[0].Amount).toBe(513.75);
    expect(p.AllowOnlineCreditCardPayment).toBe(true);
    expect(p.BillEmail).toEqual({ Address: "a@b.co" });
  });
  it("reads paid state and pay link", () => {
    expect(readInvoice({ Invoice: { Balance: 0, SyncToken: "2" } })).toEqual({ balance: 0, link: null, syncToken: "2" });
    expect(readInvoice({ Invoice: { Balance: 513.75, InvoiceLink: "https://pay" } })?.link).toBe("https://pay");
    expect(readInvoice({})).toBeNull();
  });
});
