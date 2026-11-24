// The itemized lines on a client's balance, in plain words. Pure.
import { SAMPLE_CENTS, durationLabel, type finalInvoice } from "./billing";
import { chargeCents, type Charge } from "./charges";
import { formatMoney } from "./pricing";

type Inv = ReturnType<typeof finalInvoice>;

export type BalanceRow = { label: string; amount: string; strong?: boolean };

// visit: the day of service and the minutes on site, so a bill sent days later still says what it covers.
export function balanceRows(o: { inv: Inv; tripOnly: boolean; service: string; charges: Charge[]; legacySamples: number; visit?: { dateLabel: string; minutes: number | null } }): BalanceRow[] {
  const { inv } = o;
  const rows: BalanceRow[] = [];
  if (o.visit) {
    rows.push({ label: "Date of visit", amount: o.visit.dateLabel });
    if (!o.tripOnly && o.visit.minutes !== null) rows.push({ label: "Time on site", amount: durationLabel(o.visit.minutes) });
  }
  if (!o.tripOnly) {
    rows.push({ label: `${o.service}, first hour`, amount: formatMoney(inv.firstHour) });
    if (inv.quarters > 0) rows.push({ label: `Additional time, ${durationLabel(inv.quarters * 15)} at $195 an hour`, amount: formatMoney(inv.extraTime) });
    if (o.legacySamples > 0) rows.push({ label: `Lab samples (${o.legacySamples} x ${formatMoney(SAMPLE_CENTS)})`, amount: formatMoney(o.legacySamples * SAMPLE_CENTS) });
  }
  for (const c of o.charges) {
    rows.push({ label: c.qty === 1 ? c.description : `${c.description} (${c.qty} x ${formatMoney(c.unit_cents)})`, amount: formatMoney(chargeCents(c)) });
  }
  rows.push({ label: "Total", amount: formatMoney(inv.total), strong: true });
  if (inv.deposit > 0) rows.push({ label: "Deposit paid", amount: `-${formatMoney(inv.deposit)}` });
  rows.push({ label: "Balance due", amount: formatMoney(inv.balance), strong: true });
  return rows;
}

// The same lines as plain text, for emails.
export const balanceLines = (o: Parameters<typeof balanceRows>[0]): string[] => balanceRows(o).map((r) => `${r.label}: ${r.amount}`);
