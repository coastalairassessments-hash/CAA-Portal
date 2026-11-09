// SERVER ONLY. Makes the deposit invoice in QuickBooks and finds the link the client pays from.
// Used when a client books and pays in one go, and when Cory sends an offer.
import { depositInvoicePayload } from "./qbInvoice";
import { createInvoice, emailInvoice, ensureCustomer, ensureServiceItem, getInvoice, qbConnected } from "./qbSync";
import { formatDateLabel, todayInNewYork } from "./dates";
import { formatTime } from "./labels";

export type DepositRow = {
  name: string; phone: string; email: string; address: string; city: string; zip: string;
  confirmed_date: string; confirmed_time: string; deposit_cents: number;
};

export type DepositMade = { customerId: string; invoiceId: string; payUrl: string | null };

// Throws if QuickBooks is not connected or says no. The caller decides what to tell the client.
export async function createDepositInvoice(row: DepositRow): Promise<DepositMade> {
  if (!(await qbConnected())) throw new Error("QuickBooks is not connected");
  const customerId = await ensureCustomer(row);
  const itemId = await ensureServiceItem();
  const when = `${formatDateLabel(row.confirmed_date)} at ${formatTime(String(row.confirmed_time).slice(0, 5))}`;
  const made = await createInvoice(
    depositInvoicePayload({
      customerId,
      itemId,
      description: `Deposit to hold ${when}`,
      cents: row.deposit_cents,
      email: row.email,
      txnDate: todayInNewYork(),
    }),
  );
  const payUrl = (await getInvoice(made.id).catch(() => null))?.link ?? null;
  // No hosted link? Have QuickBooks email the invoice with its pay button instead.
  if (!payUrl) await emailInvoice(made.id, row.email);
  return { customerId, invoiceId: made.id, payUrl };
}
