import { describe, expect, it } from "vitest";
import { canOpenReport, ownsJob } from "./clientAuth";
import { reportPath } from "./report";

const JOB = "11111111-1111-1111-1111-111111111111";
const ME = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const paid = { id: JOB, client_id: ME, report_path: reportPath(JOB), final_paid_at: "2026-11-04T12:00:00Z", report_released_at: null };

describe("ownsJob", () => {
  it("is true only for the job's own client", () => {
    expect(ownsJob(ME, { client_id: ME })).toBe(true);
    expect(ownsJob(OTHER, { client_id: ME })).toBe(false);
  });
  it("is false with no signed-in client or no owner on the job", () => {
    expect(ownsJob(null, { client_id: ME })).toBe(false);
    expect(ownsJob(undefined, { client_id: null })).toBe(false);
    expect(ownsJob(ME, { client_id: null })).toBe(false); // contractor jobs
  });
});

describe("canOpenReport", () => {
  it("opens for the owner once paid", () => {
    expect(canOpenReport(ME, paid)).toBe(true);
    expect(canOpenReport(ME, { ...paid, final_paid_at: null, report_released_at: "2026-11-04T12:00:00Z" })).toBe(true);
  });
  it("never opens another client's report", () => {
    expect(canOpenReport(OTHER, paid)).toBe(false);
    expect(canOpenReport(null, paid)).toBe(false);
  });
  it("stays shut while locked or missing", () => {
    expect(canOpenReport(ME, { ...paid, final_paid_at: null })).toBe(false);
    expect(canOpenReport(ME, { ...paid, report_path: null })).toBe(false);
  });
  it("refuses a file path from a different job's folder", () => {
    expect(canOpenReport(ME, { ...paid, report_path: reportPath("22222222-2222-2222-2222-222222222222") })).toBe(false);
  });
});
