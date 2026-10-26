// Ready-to-send texts. Cory taps one, Messages opens with it written, he picks who gets it.
// Paste your Google review link between the quotes to turn on review texts and emails.
export const GOOGLE_REVIEW_URL = "";

const base = (siteUrl: string) => siteUrl.replace(/\/+$/, "");
const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";

// While on the phone: "let me send you a link".
export function linkText(siteUrl: string): string {
  return `Hi, this is Coastal Air Assessments. Here is the link we talked about: ${base(siteUrl)}/request. It takes about two minutes to pick a day and add your information. There is nothing to pay to request.`;
}

// After a call you could not take.
export function missedCallText(siteUrl: string): string {
  return `Hi, this is Coastal Air Assessments. Sorry I missed your call, I'm with a client. You can see pricing and request a date here: ${base(siteUrl)}. Or text me what's going on and I'll call you back.`;
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

export function reviewEmail(row: { name: string }, reviewUrl: string) {
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
      "Coastal Air Assessments",
    ].join("\n"),
  };
}
