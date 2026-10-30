// Sent the moment a client submits a request, so they know it landed and what happens next.
import { formatDateLabel } from "./dates";
import { formatTime, issueLabel } from "./labels";
import { LICENSE_LINE, REPLY_PROMISE } from "./business";
import { SITE_URL_FALLBACK } from "./notify";
import { bookingLine } from "./confirm";

export function receivedEmail(
  r: { name: string; issue: string; preferred_date: string; preferred_time: string; public_token?: string | null },
  siteUrl: string = SITE_URL_FALLBACK,
) {
  const first = r.name.trim().split(/\s+/)[0] || "there";
  const when = `${formatDateLabel(r.preferred_date)} at ${formatTime(r.preferred_time)}`;
  return {
    subject: "We received your request",
    text: [
      `Hi ${first},`,
      "",
      `We received your request for ${issueLabel(r.issue)} on ${when}. There is nothing to pay today. ${REPLY_PROMISE}`,
      "",
      "What happens next:",
      "1. We confirm your time and send a secure deposit link.",
      "2. Your deposit (75% of the first hour) locks the time. If two people ask for the same time, the first deposit gets it.",
      "3. Cancel more than 24 hours ahead and your deposit is refunded.",
      "",
      ...bookingLine(r, siteUrl),
      "Questions? Reply to this email, or call or text 561-400-0929.",
      "",
      "Coastal Air Assessments",
      LICENSE_LINE,
    ].join("\n"),
  };
}
