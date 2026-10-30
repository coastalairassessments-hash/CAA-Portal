import { LATEST_START } from "./slots";
import { z } from "zod";
import { formatDateLabel, isRealDate, todayInNewYork } from "./dates";
import { formatTime } from "./labels";
import { formatMoney } from "./pricing";

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
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a start time").refine((v) => v <= LATEST_START, "The latest start is 1:00 PM"),
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
  public_token?: string | null;
};
export type Booking = { date: string; time: string; hours: number };

// "Your booking" link for the client, when the job has a private token.
export const bookingLine = (row: { public_token?: string | null }, siteUrl: string) =>
  row.public_token ? [`Your booking, any time: ${siteUrl.replace(/\/+$/, "")}/booking/${row.public_token}`, ""] : [];

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "there";
const hoursWord = (h: number) => (h === 1 ? "1 hour" : `${h} hours`);

export function confirmEmail(row: ConfirmRow, b: Booking, siteUrl = "https://caaportal.netlify.app") {
  const when = `${formatDateLabel(b.date)} at ${formatTime(b.time)}`;
  return {
    subject: `Your visit is confirmed: ${when}`,
    text: [
      `Hi ${firstName(row.name)},`,
      "",
      "We received your deposit, and your Coastal Air Assessments visit is confirmed.",
      "",
      `When: ${when}`,
      `Where: ${row.address}, ${row.city} ${row.zip}`,
      `We have planned about ${hoursWord(b.hours)} on site. Every visit has a one-hour minimum.`,
      "If you would like to limit our time on site, reply to this email. The assessment will then cover the areas we can complete in that time.",
      "",
      "A calendar invite is attached. Tap it to add the visit to your calendar.",
      "To cancel or reschedule, reply to this email. More than 24 hours before your visit is a full refund of your deposit.",
      "Reply to this email with any questions.",
      "",
      ...bookingLine(row, siteUrl),
      `Terms you agreed to: ${siteUrl.replace(/\/+$/, "")}/terms`,
      `Booking and payment policy: ${siteUrl.replace(/\/+$/, "")}/policy`,
      "",
      "Coastal Air Assessments",
    ].join("\n"),
  };
}

const whenOf = (b: Booking) => `${formatDateLabel(b.date)} at ${formatTime(b.time)}`;

// Sent when Cory approves a request. The date is NOT held until the deposit arrives.
export function offerEmail(row: ConfirmRow, b: Booking, deposit: number, siteUrl = "https://caaportal.netlify.app") {
  return {
    subject: `Your proposed visit: ${whenOf(b)}`,
    text: [
      `Hi ${firstName(row.name)},`,
      "",
      "Thank you for your request. We can see you here:",
      "",
      `When: ${whenOf(b)}`,
      `Where: ${row.address}, ${row.city} ${row.zip}`,
      `We have planned about ${hoursWord(b.hours)} on site. Every visit has a one-hour minimum.`,
      "If you would like to limit our time on site, reply to this email. The assessment will then cover the areas we can complete in that time.",
      "",
      `A 75% deposit of ${formatMoney(deposit)} holds the date. Your deposit invoice follows in a separate message.`,
      "The date is held when the deposit is received. If two people ask for the same time, the first deposit holds it.",
      "",
      "Reply to this email with any questions.",
      "",
      ...bookingLine(row, siteUrl),
      `Terms you agreed to: ${siteUrl.replace(/\/+$/, "")}/terms`,
      `Booking and payment policy: ${siteUrl.replace(/\/+$/, "")}/policy`,
      "",
      "Coastal Air Assessments",
    ].join("\n"),
  };
}

// Sent to a client whose offered time was taken by an earlier deposit.
export function takenEmail(row: ConfirmRow, b: Booking) {
  return {
    subject: "That time is no longer available",
    text: [
      `Hi ${firstName(row.name)},`,
      "",
      `Another client's deposit arrived first for ${whenOf(b)}, so that time is no longer available.`,
      "",
      "Reply to this email with another day that works and we'll set it up.",
      "",
      "Coastal Air Assessments",
    ].join("\n"),
  };
}

export function offerText(row: ConfirmRow, b: Booking, deposit: number): string {
  return `Hi ${firstName(row.name)}, this is Coastal Air Assessments. We can see you ${whenOf(b)} at ${row.address}. A 75% deposit (${formatMoney(deposit)}) holds the date. The invoice is coming by email.`;
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
  return `Hi ${firstName(row.name)}, this is Coastal Air Assessments. You're confirmed for ${formatDateLabel(b.date)} at ${formatTime(b.time)} at ${row.address}. Plan on about ${hoursWord(b.hours)}. Thank you for the deposit.`;
}

// Opens the Messages app with the text already written. Cory taps send.
export function smsLink(phone: string, body: string): string {
  return `sms:${phone}&body=${encodeURIComponent(body)}`;
}

// One-tap texts from the Today screen. Cory taps send.
export function onMyWayText(row: { name: string }): string {
  return `Hi ${firstName(row.name)}, this is Coastal Air Assessments. I'm on my way.`;
}
export function runningLateText(row: { name: string }, minutes = 15): string {
  return `Hi ${firstName(row.name)}, this is Coastal Air Assessments. I'm running about ${minutes} minutes behind. Thank you for your patience.`;
}

// Sent when a booking is cancelled. Says plainly whether the deposit comes back.
export function cancelEmail(row: ConfirmRow, b: Booking, refund: boolean, paid: boolean) {
  const money = !paid
    ? ""
    : refund
      ? "Your deposit will be refunded in full. It can take a few business days to appear."
      : "Because this is within 24 hours of the visit, the deposit is not refunded, as described in the booking policy.";
  return {
    subject: `Your visit is cancelled: ${whenOf(b)}`,
    text: [
      `Hi ${firstName(row.name)},`,
      "",
      `Your Coastal Air Assessments visit on ${whenOf(b)} is cancelled.`,
      money,
      "",
      "If you would like to book another day, reply to this email.",
      "",
      "Coastal Air Assessments",
    ]
      .filter((l, i, a) => l !== "" || a[i - 1] !== "")
      .join("\n"),
  };
}
