import { describe, expect, it } from "vitest";
import { isSection, parseSection } from "./job";

describe("job drawers", () => {
  it("lab: blanks become null, dollars become cents", () => {
    const r = parseSection("lab", {
      lab_name: " EMSL ", lab_samples: "3", lab_coc: "", lab_sent_on: "2026-10-28",
      lab_results_on: "", lab_cost_cents: "$112.50",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      const d = r.data as Record<string, unknown>;
      expect(d.lab_name).toBe("EMSL");
      expect(d.lab_samples).toBe(3);
      expect(d.lab_coc).toBeNull();
      expect(d.lab_results_on).toBeNull();
      expect(d.lab_cost_cents).toBe(11250);
    }
  });
  it("rejects nonsense numbers and dates", () => {
    expect(parseSection("lab", { lab_samples: "-1" }).success).toBe(false);
    expect(parseSection("lab", { lab_samples: "2.5" }).success).toBe(false);
    expect(parseSection("lab", { lab_cost_cents: "abc" }).success).toBe(false);
    expect(parseSection("lab", { lab_sent_on: "Oct 5" }).success).toBe(false);
  });
  it("money: extras default to 0, method validated", () => {
    const ok = parseSection("money", { deposit_invoice_no: "1001", final_invoice_no: "", extras_cents: "", payment_method: "card" });
    expect(ok.success).toBe(true);
    if (ok.success) expect((ok.data as Record<string, unknown>).extras_cents).toBe(0);
    expect(parseSection("money", { payment_method: "bitcoin" }).success).toBe(false);
  });
  it("client: checkbox", () => {
    const on = parseSection("client", { qb_customer_id: "55", repeat_client: "on" });
    const off = parseSection("client", { qb_customer_id: "" });
    expect(on.success && (on.data as Record<string, unknown>).repeat_client).toBe(true);
    expect(off.success && (off.data as Record<string, unknown>).repeat_client).toBe(false);
  });
  it("only known sections", () => {
    expect(isSection("lab")).toBe(true);
    expect(isSection("status")).toBe(false);
    expect(isSection("__proto__")).toBe(false);
  });
});
