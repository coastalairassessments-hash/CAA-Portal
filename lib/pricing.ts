// Prices in cents. First hour by service; the deposit is 75% of it.
export const DEPOSIT_RATE = 0.75;

export function firstHourCents(issue: string): number {
  if (issue === "post_remediation") return 57500;
  if (issue === "consultation") return 37500;
  return 68500;
}

export const depositCents = (issue: string): number =>
  Math.round(firstHourCents(issue) * DEPOSIT_RATE);

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
