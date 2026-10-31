import { SIGNOFF } from "./business";
import { rebookUrl } from "./links";
// Ready-to-send texts. Cory taps one, Messages opens with it written, he picks who gets it.
// Paste your Google review link between the quotes to turn on review texts and emails.
export const GOOGLE_REVIEW_URL = "https://g.page/r/CR_el8247giREBM/review";

const base = (siteUrl: string) => siteUrl.replace(/\/+$/, "");
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

// The three link texts. They send people to the site, where they see pricing and open days and choose to enroll.
// Each says only what is true: no promise about price, time or callbacks beyond "we'll get back to you".
const SEE = "You can see our pricing and open days, and enroll if you'd like, here:";

// After you spoke with them.
export function linkText(siteUrl: string): string {
  return `Hi, it's Cory with Coastal Air Assessments. Good talking with you. Text me with any questions. ${SEE} ${base(siteUrl)}`;
}

// A call you could not take, during the day.
export function missedCallText(siteUrl: string): string {
  return `Hi, this is Coastal Air Assessments. Sorry we missed your call. Reply with what's going on and we'll get back to you. ${SEE} ${base(siteUrl)}`;
}

// A call when the office is closed.
export function afterHoursText(siteUrl: string): string {
  return `Hi, this is Coastal Air Assessments. We're away from the phone right now. Reply with what's going on and we'll get back to you. ${SEE.replace("if you'd like", "anytime")} ${base(siteUrl)}`;
}

export function depositReminderText(
  row: { name: string },
  whenLabel: string,
  depositLabel: string,
): string {
  return `Hi ${firstName(row.name)}, this is Coastal Air Assessments. A reminder that your ${depositLabel} deposit holds ${whenLabel}. The first deposit holds the date. Your invoice was emailed to you.`;
}

export function reviewText(row: { name: string }, reviewUrl: string): string {
  return `Thank you, ${firstName(row.name)}. If we were helpful, a Google review means a lot to a small business: ${reviewUrl}`;
}

export function reviewEmail(row: { name: string; public_token?: string | null }, reviewUrl: string, siteUrl?: string) {
  const again = siteUrl ? rebookUrl(row, siteUrl) : null;
  return {
    subject: "Thank you from Coastal Air Assessments",
    text: [
      `Hi ${firstName(row.name)},`,
      "",
      "Thank you for choosing Coastal Air Assessments.",
      "",
      "If we were helpful, a short Google review helps other homeowners find us:",
      reviewUrl,
      "",
      ...(again ? ["Need another property assessed? We already have your details, so you only add the address:", again, ""] : []),
      ...SIGNOFF,
    ].join("\n"),
  };
}
