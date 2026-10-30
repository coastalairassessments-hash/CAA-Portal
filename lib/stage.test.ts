import { describe, expect, it } from "vitest";
import { stageDone } from "./stage";

const base = { status: "new", source: "client", left_at: null, final_invoice_no: null, final_paid_at: null };
describe("stageDone", () => {
  it("walks the steps", () => {
    expect(stageDone(base)).toBe(1);
    expect(stageDone({ ...base, status: "offered" })).toBe(1);
    expect(stageDone({ ...base, status: "confirmed" })).toBe(2);
    expect(stageDone({ ...base, status: "confirmed", left_at: "x" })).toBe(3);
    expect(stageDone({ ...base, status: "confirmed", left_at: "x", final_invoice_no: "1" })).toBe(4);
    expect(stageDone({ ...base, status: "confirmed", left_at: "x", final_invoice_no: "1", final_paid_at: "y" })).toBe(5);
  });
  it("shows nothing when cancelled", () => {
    expect(stageDone({ ...base, status: "cancelled" })).toBe(0);
  });
});
