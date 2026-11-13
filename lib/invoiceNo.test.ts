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

describe("jobs that already happened", () => {
  const now = new Date("2026-11-13T15:00:00Z");
  const base = { newName: "Acme", service: "prv", address: "1 Main St", time: "10:00", hours: 2 };
  it("allows yesterday only when closing it", () => {
    expect(parseContractorJob({ ...base, date: "2026-11-12" }, now).success).toBe(false);
    expect(parseContractorJob({ ...base, date: "2026-11-12", outcome: "trip" }, now).data?.outcome).toBe("trip");
  });
  it("does not allow a closed job in the future or too far back", () => {
    expect(parseContractorJob({ ...base, date: "2026-11-20", outcome: "done" }, now).success).toBe(false);
    expect(parseContractorJob({ ...base, date: "2026-05-01", outcome: "done" }, now).success).toBe(false);
  });
});
