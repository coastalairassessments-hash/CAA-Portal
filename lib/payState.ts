// SERVER ONLY. Asks whichever service holds a deposit (Stripe or QuickBooks) if it was paid.
import { getInvoice, voidInvoice } from "./qbSync";
import { expireCheckout, getCheckout, isStripeId } from "./stripePay";

// null = could not tell right now. Try again later.
export async function paymentState(id: string): Promise<{ paid: boolean; cents?: number } | null> {
  if (isStripeId(id)) {
    const s = await getCheckout(id).catch(() => null);
    return s ? { paid: s.paid, cents: s.cents } : null;
  }
  const inv = await getInvoice(id).catch(() => null);
  return inv ? { paid: inv.balance <= 0 } : null;
}

export async function voidPayment(id: string): Promise<void> {
  if (isStripeId(id)) await expireCheckout(id);
  else await voidInvoice(id);
}
