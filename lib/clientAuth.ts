// Client portal rules that need no database, so they are easy to test.
// Tokens, hashing and expiry are the same ones contractors use.
import { LOGIN_MINUTES, SESSION_DAYS, hashToken, loginExpiry, newToken, parseEmail, sessionExpiry, validToken } from "./contractorAuth";
import { reportState, validReportPath } from "./report";

export { LOGIN_MINUTES, SESSION_DAYS, hashToken, loginExpiry, newToken, parseEmail, sessionExpiry, validToken };
export const CLIENT_COOKIE = "caa_client";
export const MAX_LINKS_PER_HOUR = 5;

export type JobAccess = {
  id: string;
  client_id: string | null;
  report_path?: string | null;
  final_paid_at?: string | null;
  report_released_at?: string | null;
};

// A job belongs to a client only when the job's own client_id says so. Contractor jobs have none.
export const ownsJob = (clientId: string | null | undefined, job: Pick<JobAccess, "client_id">) =>
  Boolean(clientId) && job.client_id === clientId;

// The report opens for its owner, once unlocked, and only from that job's own folder.
export function canOpenReport(clientId: string | null | undefined, job: JobAccess): boolean {
  return ownsJob(clientId, job) && reportState(job) === "ready" && validReportPath(job.id, job.report_path);
}
