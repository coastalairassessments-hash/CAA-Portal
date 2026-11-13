// The itemized lines on a client's balance, in plain words. Pure.
import { SAMPLE_CENTS, QUARTER_HOUR_CENTS, type finalInvoice } from "./billing";
import { chargeCents, type Charge } from "./charges";
import { formatMoney } from "./pricing";

type Inv = ReturnType<typeof finalInvoice>;

export function balanceLines(o: { inv: Inv; tripOnly: boolean; service: string; charges: Charge[]; legacySamples: number }): string[] {
  const { inv } = o;
  const lines: string[] = [];
  if (!o.tripOnly) {
    lines.push(`${o.service}, first hour: ${formatMoney(inv.firstHour)}`);
    if (inv.quarters > 0) lines.push(`Extra time (${inv.quarters} x ${formatMoney(QUARTER_HOUR_CENTS)}): ${formatMoney(inv.extraTime)}`);
    if (o.legacySamples > 0) lines.push(`Lab samples (${o.legacySamples} x ${formatMoney(SAMPLE_CENTS)}): ${formatMoney(o.legacySamples * SAMPLE_CENTS)}`);
  }
  for (const c of o.charges) {
    lines.push(c.qty === 1 ? `${c.description}: ${formatMoney(chargeCents(c))}` : `${c.description} (${c.qty} x ${formatMoney(c.unit_cents)}): ${formatMoney(chargeCents(c))}`);
  }
  lines.push(`Total: ${formatMoney(inv.total)}`);
  if (inv.deposit > 0) lines.push(`Deposit paid: -${formatMoney(inv.deposit)}`);
  lines.push(`Balance due: ${formatMoney(inv.balance)}`);
  return lines;
}
