// The note sent the same day, after the visit: what we saw, in plain words, and what happens next.
// Cory writes the findings. The software adds only the steps that follow.
import { PHONE, SIGNOFF } from "./business";
import { bookingLine } from "./links";

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

export const MAX_SUMMARY = 1500;

export function visitSummaryEmail(row: { name: string; public_token?: string | null }, note: string, siteUrl: string) {
  return {
    subject: "Thank you for having us today",
    text: [
      `Hi ${firstName(row.name)},`,
      "",
      "Thank you for having us out today. Here is what we saw, in plain words:",
      "",
      note.trim(),
      "",
      "What happens next:",
      "1. Your final invoice comes by email.",
      "2. Your written report is released once the final invoice is paid, usually within a few days.",
      "",
      ...bookingLine(row, siteUrl),
      `Questions? Call or text ${PHONE}.`,
      "",
      ...SIGNOFF,
    ].join("\n"),
  };
}
