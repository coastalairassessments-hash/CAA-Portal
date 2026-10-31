import { describe, expect, it } from "vitest";
import { invoiceReminderEmail, reminderDue, type OwedRow } from "./invoiceReminder";

const base: OwedRow = {
  status: "confirmed", email: "a@b.com", qb_invoice_id: "9", final_invoiced_at: "2026-11-01T15:00:00Z",
  final_paid_at: null, invoice_reminders: 0, invoice_reminded_at: null,
};

describe("reminderDue", () => {
  it("waits until day 3", () => {
    expect(reminderDue(base, "2026-11-03")).toBeNull();
    expect(reminderDue(base, "2026-11-04")).toBe(1);
  });
  it("then day 7 and day 14, then stops", () => {
    expect(reminderDue({ ...base, invoice_reminders: 1 }, "2026-11-07")).toBeNull();
    expect(reminderDue({ ...base, invoice_reminders: 1 }, "2026-11-08")).toBe(2);
    expect(reminderDue({ ...base, invoice_reminders: 2 }, "2026-11-15")).toBe(3);
    expect(reminderDue({ ...base, invoice_reminders: 3 }, "2026-12-30")).toBeNull();
  });
  it("skips paid, unsent or no-email rows", () => {
    expect(reminderDue({ ...base, final_paid_at: "2026-11-02T00:00:00Z" }, "2026-11-10")).toBeNull();
    expect(reminderDue({ ...base, qb_invoice_id: null }, "2026-11-10")).toBeNull();
    expect(reminderDue({ ...base, email: null }, "2026-11-10")).toBeNull();
  });
  it("never sends twice in one day", () => {
    expect(reminderDue({ ...base, invoice_reminders: 1, invoice_reminded_at: "2026-11-08T12:00:00Z" }, "2026-11-08")).toBeNull();
  });
});

describe("invoiceReminderEmail", () => {
  it("is friendly and includes the pay link", () => {
    const m = invoiceReminderEmail({ name: "Sam Lee", final_invoice_no: "1042" }, 1, "https://pay.example/x");
    expect(m.text).toContain("Hi Sam");
    expect(m.text).toContain("https://pay.example/x");
    expect(m.text).toContain("ignore this");
  });
  it("works without a link", () => {
    expect(invoiceReminderEmail({ name: "Sam" }, 2, null).text).toContain("invoice email we sent you");
  });
});
