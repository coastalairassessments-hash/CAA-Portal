// What clients should and should not do before the visit, so the air readings are fair.
import { formatDateLabel } from "./dates";
import { formatTime } from "./labels";
import type { ConfirmRow } from "./confirm";
import { bookingLine } from "./links";
import { SITE_URL_FALLBACK } from "./notify";
import { PHONE, SIGNOFF } from "./business";

export const PREP_INTRO = "Your assessment is only as fair as the air we measure. Before we arrive:";

export const PREP_DO = [
  "Keep windows and doors closed.",
  "Turn off air purifiers and dehumidifiers.",
  "Unplug plug-in air fresheners and diffusers.",
  "Write down where you have seen water, stains or smells, when it started, and any past leaks or repairs. Photos help.",
  "Be there, or have an adult there who knows the history.",
  "Secure pets.",
];

export const PREP_DONT = [
  "Don't cook on the stove top, take long hot showers, or vape. They add particles to the air.",
  "Don't use sprays, candles or fogging products.",
  "Don't clean, bleach or remove anything that looks suspect. It can hide what we need to see.",
  "Don't start repairs or demolition.",
];

export function prepLines(): string[] {
  return [PREP_INTRO, "", ...PREP_DO.map((l) => `- ${l}`), "", ...PREP_DONT.map((l) => `- ${l}`), ""];
}

// Sent the evening before the visit.
export function dayBeforeEmail(
  row: ConfirmRow & { name: string },
  b: { date: string; time: string },
  siteUrl: string = SITE_URL_FALLBACK,
) {
  const first = row.name.trim().split(/\s+/)[0] || "there";
  return {
    subject: `Tomorrow: your visit at ${formatTime(b.time)}`,
    text: [
      `Hi ${first},`,
      "",
      `This is a reminder that we are coming tomorrow, ${formatDateLabel(b.date)} at ${formatTime(b.time)}, to ${row.address}.`,
      "",
      ...prepLines(),
      ...bookingLine(row, siteUrl),
      `Need to change something? Call or text ${PHONE}.`,
      "",
      ...SIGNOFF,
    ].join("\n"),
  };
}
