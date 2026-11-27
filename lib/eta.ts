// "On my way" with an arrival estimate. Cory picks the minutes; the software only does the clock.
import { smsLink } from "./confirm";

export const ETA_CHOICES = [15, 30, 45, 60] as const;

export function arrivalClock(now: Date, minutes: number): string {
  const at = new Date(now.getTime() + minutes * 60_000);
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }).format(at);
}

const first = (name: string) => name.trim().split(/\s+/)[0] || "there";

export function onMyWayEtaText(row: { name: string }, minutes: number, now: Date, link?: string | null): string {
  return [
    `Hi ${first(row.name)}, this is Coastal Air Assessments. I'm on my way, about ${minutes} minutes out, arriving around ${arrivalClock(now, minutes)}.`,
    ...(link ? [`Follow along: ${link}`] : []),
  ].join(" ");
}

export const etaSmsLink = (phone: string, row: { name: string }, minutes: number, now: Date, link?: string | null) =>
  smsLink(phone, onMyWayEtaText(row, minutes, now, link));
