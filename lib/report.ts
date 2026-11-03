import { PHONE, SIGNOFF } from "./business";
import { bookingUrl } from "./links";
import { SITE_URL_FALLBACK } from "./notify";

export const MAX_REPORT_BYTES = 10_000_000;
export const REPORT_BUCKET = "job-reports";

// none = no file yet. locked = uploaded, waiting on payment. ready = the client can open it.
export type ReportState = "none" | "locked" | "ready";

export function reportState(r: { report_path?: string | null; final_paid_at?: string | null; report_released_at?: string | null }): ReportState {
  if (!r.report_path) return "none";
  return r.final_paid_at || r.report_released_at ? "ready" : "locked";
}

// Files live under the job's own folder, so one job can never read another job's report.
export function reportPath(requestId: string, rand: string = crypto.randomUUID()) {
  return `${requestId}/${rand}.pdf`;
}
export const validReportPath = (requestId: string, path: unknown) =>
  typeof path === "string" && new RegExp(`^${requestId}/[0-9a-f-]{36}\\.pdf$`, "i").test(path);

// Real PDFs start with "%PDF". A renamed file of another type is turned away.
export const looksLikePdf = (bytes: Uint8Array) =>
  bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;

export function reportLockedEmail(row: { name: string; public_token?: string | null }, siteUrl: string = SITE_URL_FALLBACK) {
  const first = row.name.trim().split(/\s+/)[0] || "there";
  const link = bookingUrl(row, siteUrl);
  return {
    subject: "Your report is ready",
    text: [
      `Hi ${first},`,
      "",
      "Your report is ready. Pay your final invoice to unlock it. The invoice is in a separate email from QuickBooks.",
      "",
      "Once it is paid, the report is emailed to you right away. You can also follow along here:",
      link ?? siteUrl,
      "",
      `Questions? Call or text ${PHONE}.`,
      "",
      ...SIGNOFF,
    ].join("\n"),
  };
}

export function reportReadyEmail(row: { name: string; public_token?: string | null }, siteUrl: string = SITE_URL_FALLBACK) {
  const first = row.name.trim().split(/\s+/)[0] || "there";
  const link = bookingUrl(row, siteUrl);
  return {
    subject: "Your report is ready",
    text: [
      `Hi ${first},`,
      "",
      "Your report is ready. Open it from your booking page, then sign in with this email address (no password) to download it:",
      link ?? siteUrl,
      "",
      `Questions about anything in it? Call or text ${PHONE}.`,
      "",
      ...SIGNOFF,
    ].join("\n"),
  };
}
