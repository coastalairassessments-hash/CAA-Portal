// SERVER ONLY. Makes a real $1 deposit invoice in QuickBooks and cancels it again.
// Proves a client could pay. Used by the Test button and the automatic daily check.
import { depositInvoicePayload } from "./qbInvoice";
import { createInvoice, ensureCustomer, ensureServiceItem, getInvoice, qbConnected, voidInvoice } from "./qbSync";
import { todayInNewYork } from "./dates";

export async function testDepositInvoice(): Promise<{ link: boolean }> {
  let step = "connecting to QuickBooks";
  try {
    if (!(await qbConnected())) throw new Error("QuickBooks is not connected");
    step = "finding the test client";
    const customerId = await ensureCustomer({ name: "CAA Test Client", email: "test@example.com" });
    step = "finding the service item";
    const itemId = await ensureServiceItem();
    step = "making the test invoice";
    const made = await createInvoice(
      depositInvoicePayload({ customerId, itemId, description: "Test, please ignore", cents: 100, email: "test@example.com", txnDate: todayInNewYork() }),
    );
    step = "reading the pay link";
    const inv = await getInvoice(made.id);
    await voidInvoice(made.id);
    return { link: !!inv?.link };
  } catch (e) {
    throw new Error(`stopped while ${step}: ${e instanceof Error ? e.message : "unknown error"}`);
  }
}
