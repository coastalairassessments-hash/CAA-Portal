// SERVER ONLY. Makes the deposit a client pays. Stripe when it is set up, otherwise QuickBooks.
import { createDepositInvoice, type DepositRow } from "./depositInvoice";
import { createCheckout, stripeConfigured } from "./stripePay";
import { formatDateLabel } from "./dates";
import { formatTime } from "./labels";
import { SITE_URL_FALLBACK } from "./notify";

export type DepositMade = { customerId: string | null; invoiceId: string; payUrl: string | null };
type Extra = { id?: string; public_token?: string | null };

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();

export async function createDeposit(row: DepositRow & Extra): Promise<DepositMade> {
  if (!stripeConfigured()) return createDepositInvoice(row);
  const site = (clean(process.env.SITE_URL) || SITE_URL_FALLBACK).replace(/\/+$/, "");
  const back = row.public_token ? `${site}/booking/${row.public_token}` : site;
  const when = `${formatDateLabel(row.confirmed_date)} at ${formatTime(String(row.confirmed_time).slice(0, 5))}`;
  const made = await createCheckout({
    cents: row.deposit_cents,
    description: `Deposit to hold ${when} - Coastal Air Assessments`,
    email: row.email,
    requestId: row.id,
    successUrl: back,
    cancelUrl: back,
  });
  // The Stripe session id is kept in the same field the invoice id used; "cs_" marks it as Stripe.
  return { customerId: null, invoiceId: made.id, payUrl: made.url };
}
