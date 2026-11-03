import { describe, expect, it } from "vitest";
import { portalRow, statusLabel } from "./clientPortal";

const job = { id: "j1", public_token: "a".repeat(32), status: "confirmed", issue: "mold", address: "12 Palm St, Stuart", confirmed_date: "2026-11-05", confirmed_time: "10:00:00", preferred_date: "2026-11-05" };

describe("statusLabel", () => {
  it("names each stage in plain words", () => {
    expect(statusLabel({ status: "new" })).toBe("Request received");
    expect(statusLabel({ status: "offered" })).toBe("Waiting on deposit");
    expect(statusLabel({ status: "confirmed" })).toBe("Booked");
    expect(statusLabel({ status: "confirmed", left_at: "x" })).toBe("Visit done");
    expect(statusLabel({ status: "confirmed", left_at: "x", final_paid_at: "y" })).toBe("Paid");
    expect(statusLabel({ status: "cancelled" })).toBe("Cancelled");
  });
});

describe("portalRow", () => {
  it("shows when, where and the report state", () => {
    const row = portalRow(job);
    expect(row.when).toBe("Thu, Nov 5 at 10:00 AM");
    expect(row.report).toBe("none");
    expect(row.bookingPath).toBe(`/booking/${"a".repeat(32)}`);
  });
  it("shows a locked report until paid", () => {
    expect(portalRow({ ...job, report_path: "x/y.pdf" }).report).toBe("locked");
    expect(portalRow({ ...job, report_path: "x/y.pdf", final_paid_at: "y" }).report).toBe("ready");
  });
  it("copes with a job that has no link or date", () => {
    const row = portalRow({ ...job, public_token: null, confirmed_date: null, confirmed_time: null, preferred_date: null });
    expect(row.bookingPath).toBeNull();
    expect(row.when).toBe("");
  });
});
