import { describe, expect, it } from "vitest";
import { looksLikePdf, reportPath, reportReadyEmail, reportState, validReportPath } from "./report";

const ID = "11111111-1111-1111-1111-111111111111";
describe("reportState", () => {
  it("is none without a file", () => expect(reportState({})).toBe("none"));
  it("locks until paid", () => expect(reportState({ report_path: "x" })).toBe("locked"));
  it("opens when paid", () => expect(reportState({ report_path: "x", final_paid_at: "2026-11-01T00:00:00Z" })).toBe("ready"));
  it("opens when released early", () => expect(reportState({ report_path: "x", report_released_at: "2026-11-01T00:00:00Z" })).toBe("ready"));
});
describe("report paths", () => {
  it("stays inside the job's folder", () => {
    const p = reportPath(ID);
    expect(p.startsWith(`${ID}/`)).toBe(true);
    expect(validReportPath(ID, p)).toBe(true);
  });
  it("rejects other jobs and odd names", () => {
    expect(validReportPath("22222222-2222-2222-2222-222222222222", reportPath(ID))).toBe(false);
    expect(validReportPath(ID, `${ID}/../x.pdf`)).toBe(false);
    expect(validReportPath(ID, null)).toBe(false);
  });
});
describe("looksLikePdf", () => {
  it("accepts the PDF header", () => expect(looksLikePdf(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe(true));
  it("rejects other files", () => expect(looksLikePdf(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0]))).toBe(false));
});
describe("reportReadyEmail", () => {
  it("links to the booking page and attaches nothing", () => {
    const m = reportReadyEmail({ name: "Sam Lee", public_token: "a".repeat(32) }, "https://x.test");
    expect(m.text).toContain(`https://x.test/booking/${"a".repeat(32)}`);
    expect(m.subject).toBe("Your report is ready");
  });
});
