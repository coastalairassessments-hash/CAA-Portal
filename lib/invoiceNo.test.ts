import { describe, expect, it } from "vitest";
import { dueDate, invoiceNumber } from "./invoiceNo";
import { parseContractorJob } from "./contractorJob";

describe("invoice number and due date", () => {
  it("is stable and readable", () => {
    expect(invoiceNumber({ id: "ab12cdef-0000-0000-0000-000000000000", confirmed_date: "2026-11-17" })).toBe("CAA-20261117-AB12");
  });
  it("gives contractors 7 days", () => {
    expect(dueDate({ source: "contractor", final_invoiced_at: "2026-11-17T15:00:00Z" })).toBe("2026-11-24");
    expect(dueDate({ source: "instant", final_invoiced_at: "2026-11-17T15:00:00Z" })).toBe("2026-11-17");
  });
  it("accepts an optional reference", () => {
    const base = { newName: "Acme", service: "prv", address: "1 Main St", date: "2030-01-02", time: "10:00", hours: 2 };
    expect(parseContractorJob({ ...base, reference: " PO 123 " }).data?.reference).toBe("PO 123");
    expect(parseContractorJob(base).data?.reference).toBe("");
  });
});
