import { z } from "zod";
import { formatDateLabel, isRealDate, todayInNewYork } from "./dates";
import { formatTime } from "./labels";

// What Cory enters on the confirm screen.
export function parseConfirm(input: unknown, now: Date = new Date()) {
  const today = todayInNewYork(now);
  return z
    .object({
      id: z.string().uuid("Missing request"),
      date: z
        .string()
        .refine(isRealDate, "Pick a valid date")
        .refine((v) => v >= today, "Pick a date that is not in the past"),
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a start time"),
      hours: z.coerce.number().int("Pick the hours").min(1, "Pick the hours").max(8, "Pick the hours"),
    })
    .safeParse(input);
}

export type ConfirmRow = {
  name: string;
  phone: string;
  address: string;
  city: string;
  zip: string;
};
export type Booking = { date: string; time: string; hours: number };

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";
const hoursWord = (h: number) => (h === 1 ? "1 hour" : `${h} hours`);

export function confirmEmail(row: ConfirmRow, b: Booking, siteUrl = "https://caaportal.netlify.app") {
  const when = `${formatDateLabel(b.date)} at ${formatTime(b.time)}`;
  return {
    subject: `Your visit is confirmed: ${when}`,
    text: [
      `Hi ${firstName(row.name)},`,
      "",
      "Your Coastal Air Assessments visit is confirmed.",
      "",
      `When: ${when}`,
      `Where: ${row.address}, ${row.city} ${row.zip}`,
      `We have planned about ${hoursWord(b.hours)} on site. Every visit has a one-hour minimum.`,
      "If you would like to limit our time on site, reply to this email. The assessment will then cover the areas we can complete in that time.",
      "",
      "Your deposit link comes next, in a separate message. Your date is held for you in the meantime.",
      "",
      "Reply to this email with any questions.",
      "",
      `Terms you agreed to: ${siteUrl.replace(/\/+$/, "")}/terms`,
      "",
      "Coastal Air Assessments",
    ].join("\n"),
  };
}

export function declineEmail(row: ConfirmRow) {
  return {
    subject: "About your assessment request",
    text: [
      `Hi ${firstName(row.name)},`,
      "",
      "Thank you for reaching out to Coastal Air Assessments. We can't take this request as submitted.",
      "",
      "Reply to this email and we'll find a time or a better fit for you.",
      "",
      "Coastal Air Assessments",
    ].join("\n"),
  };
}

export function confirmText(row: ConfirmRow, b: Booking): string {
  return `Hi ${firstName(row.name)}, this is Coastal Air Assessments. You're confirmed for ${formatDateLabel(b.date)} at ${formatTime(b.time)} at ${row.address}. Plan on about ${hoursWord(b.hours)}. Your deposit link is coming by email.`;
}

// Opens the Messages app with the text already written. Cory taps send.
export function smsLink(phone: string, body: string): string {
  return `sms:${phone}&body=${encodeURIComponent(body)}`;
}
