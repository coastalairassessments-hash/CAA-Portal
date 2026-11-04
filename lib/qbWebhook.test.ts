import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { touchesMoney, validSignature } from "./qbWebhook";

const KEY = "verifier-token";
const body = JSON.stringify({ eventNotifications: [{ realmId: "1", dataChangeEvent: { entities: [{ name: "Payment", id: "9", operation: "Create" }] } }] });
const sign = (b: string, k = KEY) => createHmac("sha256", k).update(b).digest("base64");

describe("validSignature", () => {
  it("accepts the real signature", () => expect(validSignature(body, sign(body), KEY)).toBe(true));
  it("rejects a forged signature", () => expect(validSignature(body, sign(body, "other"), KEY)).toBe(false));
  it("rejects a body changed after signing", () => expect(validSignature(body + " ", sign(body), KEY)).toBe(false));
  it("rejects a missing header, garbage header, or missing verifier", () => {
    expect(validSignature(body, null, KEY)).toBe(false);
    expect(validSignature(body, "not-base64!!", KEY)).toBe(false);
    expect(validSignature(body, sign(body), undefined)).toBe(false);
    expect(validSignature(body, sign(body, ""), "")).toBe(false);
  });
});

describe("touchesMoney", () => {
  it("is true for payments and invoices", () => {
    expect(touchesMoney(body)).toBe(true);
    expect(touchesMoney(body.replace("Payment", "Invoice"))).toBe(true);
  });
  it("is false for other changes and for junk", () => {
    expect(touchesMoney(body.replace("Payment", "Customer"))).toBe(false);
    expect(touchesMoney("not json")).toBe(false);
    expect(touchesMoney("{}")).toBe(false);
  });
});
