import { PHONE, SIGNOFF } from "./business";
import { formatDateLabel } from "./dates";
import { formatTime } from "./labels";
import { rebookUrl } from "./links";
import { SITE_URL_FALLBACK } from "./notify";

// Sent when a held time was not paid for and has been released. Nothing was charged.
export function releasedEmail(
  row: { name: string; public_token?: string | null },
  slot: { date: string; time: string },
  siteUrl: string = SITE_URL_FALLBACK,
) {
  const first = row.name.trim().split(/\s+/)[0] || "there";
  const when = `${formatDateLabel(slot.date)} at ${formatTime(slot.time)}`;
  const link = rebookUrl(row, siteUrl) ?? `${siteUrl.replace(/\/+$/, "")}/request`;
  return {
    subject: "Your time was released",
    text: [
      `Hi ${first},`,
      "",
      `We held ${when} for you, but the deposit was not paid, so we released the time. You were not charged.`,
      "",
      `Still want a visit? Pick a time here. Your details are already filled in: ${link}`,
      "",
      `Questions? Call or text ${PHONE}.`,
      "",
      ...SIGNOFF,
    ].join("\n"),
  };
}
