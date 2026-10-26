import type { NewRequestRow } from "./submit";

import { formatDateLabel } from "./dates";
import { formatPhone, formatTime, issueLabel, sizeLabel } from "./labels";

export const SITE_URL_FALLBACK = "https://caaportal.netlify.app";

export function buildAlert(
  row: NewRequestRow & { id: string },
  siteUrl: string = SITE_URL_FALLBACK,
) {
  const outside = row.area === "outside" ? " [OUTSIDE AREA]" : "";
  const subject = `New request: ${issueLabel(row.issue)}, ${row.city} ${row.zip}${outside}`;
  const lines = [
    `Open it: ${siteUrl.replace(/\/+$/, "")}/admin/${row.id}`,
    "",
    `Name: ${row.name}`,
    `Phone: ${formatPhone(row.phone)}${row.text_consent ? " (OK to text)" : " (no texting)"}`,
    `Email: ${row.email}`,
    `Property: ${row.address}, ${row.city} ${row.zip}${outside}`,
    `Issue: ${issueLabel(row.issue)}`,
    `Size: ${sizeLabel(row.size_band)}`,
    `Wants: ${formatDateLabel(row.preferred_date)} at ${formatTime(row.preferred_time)}`,
    row.notes ? `Notes: ${row.notes}` : "",
  ].filter((l, i) => l !== "" || i === 1);
  return { subject, text: lines.join("\n") };
}

// Email alert via Resend. Optional: if the keys are not set, it quietly skips.
export async function sendEmailAlert(
  row: NewRequestRow & { id: string },
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const key = env.RESEND_API_KEY;
  const to = env.ALERT_EMAIL;
  const from = env.ALERT_FROM;
  if (!key || !to || !from) return;

  const { subject, text } = buildAlert(row, env.SITE_URL?.trim() || SITE_URL_FALLBACK);
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) throw new Error(`Email alert failed: ${res.status}`);
}

// One email to a client (or anyone). Never throws: returns what happened so the screen can say it.
export type SendResult = { ok: true } | { ok: false; reason: string };

export async function sendEmail(
  msg: { to: string; subject: string; text: string },
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<SendResult> {
  const key = env.RESEND_API_KEY?.trim();
  const from = (env.CLIENT_FROM ?? env.ALERT_FROM)?.trim();
  const replyTo = env.ALERT_EMAIL?.trim();
  if (!key || !from) return { ok: false, reason: "email-not-set-up" };
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    return res.ok ? { ok: true } : { ok: false, reason: `resend-${res.status}` };
  } catch {
    return { ok: false, reason: "network" };
  }
}
