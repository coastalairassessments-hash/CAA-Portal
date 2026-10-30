// The daily message to Cory: how many inspections, in what order, and what is waiting on him.
import { formatDateLabel } from "./dates";
import { formatTime, issueLabel } from "./labels";
import { SITE_URL_FALLBACK } from "./notify";

export type BriefJob = {
  confirmed_time: string;
  name: string;
  issue: string;
  address: string;
  city: string;
  block_hours: number | null;
};
export type Waiting = { approve: number; deposits: number; toInvoice: number; refunds: number };

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function waitingLines(w: Waiting): string[] {
  return [
    w.approve && `${plural(w.approve, "new request")} to approve`,
    w.deposits && `${plural(w.deposits, "deposit")} waiting`,
    w.toInvoice && `${plural(w.toInvoice, "final invoice")} to send`,
    w.refunds && `${plural(w.refunds, "refund")} to issue`,
  ].filter(Boolean) as string[];
}

export function buildBriefing(
  when: "today" | "tomorrow",
  date: string,
  jobs: BriefJob[],
  waiting: Waiting,
  siteUrl: string = SITE_URL_FALLBACK,
) {
  const sorted = [...jobs].sort((a, b) => a.confirmed_time.localeCompare(b.confirmed_time));
  const label = when === "today" ? "Today" : "Tomorrow";
  const subject =
    sorted.length === 0
      ? `${label}: no inspections`
      : `${label}: ${plural(sorted.length, "inspection")}, first at ${formatTime(sorted[0].confirmed_time)}`;
  const lines = [`${label}, ${formatDateLabel(date)}`, ""];
  if (sorted.length === 0) lines.push("Nothing booked.");
  for (const j of sorted) {
    const hrs = j.block_hours ?? 1;
    lines.push(
      `${formatTime(j.confirmed_time)}  ${j.name}`,
      `${issueLabel(j.issue)}, about ${hrs} ${hrs === 1 ? "hour" : "hours"}`,
      `${j.address}, ${j.city}`,
      "",
    );
  }
  const w = waitingLines(waiting);
  if (w.length) lines.push("Waiting on you:", ...w.map((l) => `- ${l}`), "");
  lines.push(`Open: ${siteUrl.replace(/\/+$/, "")}/admin/today`);
  return { subject, text: lines.join("\n"), empty: sorted.length === 0 && w.length === 0 };
}
