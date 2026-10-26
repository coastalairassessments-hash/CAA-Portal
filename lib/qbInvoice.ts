// Pure builders for what we send to QuickBooks. No network here, so they are easy to test.
import type { finalInvoice } from "./billing";

type Inv = ReturnType<typeof finalInvoice>;

const money = (cents: number) => Math.round(cents) / 100;

export type ClientRow = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
};

export function customerPayload(r: ClientRow) {
  const out: Record<string, unknown> = { DisplayName: r.name.trim().slice(0, 100) };
  if (r.email) out.PrimaryEmailAddr = { Address: r.email };
  if (r.phone) out.PrimaryPhone = { FreeFormNumber: r.phone };
  if (r.address) {
    out.BillAddr = {
      Line1: r.address,
      ...(r.city ? { City: r.city } : {}),
      CountrySubDivisionCode: "FL",
      ...(r.zip ? { PostalCode: r.zip } : {}),
    };
  }
  return out;
}

// QuickBooks query strings use single quotes.
export const qbEscape = (v: string) => v.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

export type InvoiceInput = {
  customerId: string;
  itemId: string;
  service: string;
  inv: Inv;
  quarterMinutes: number;
  samples: number;
  email?: string | null;
  txnDate: string;
  dueDate: string;
};

export function finalInvoicePayload(i: InvoiceInput) {
  const line = (description: string, cents: number) => ({
    DetailType: "SalesItemLineDetail",
    Amount: money(cents),
    Description: description,
    SalesItemLineDetail: { ItemRef: { value: i.itemId }, Qty: 1, UnitPrice: money(cents) },
  });
  const Line = [line(`${i.service}, first hour`, i.inv.firstHour)];
  if (i.inv.extraTime > 0) Line.push(line(`Additional time, ${i.quarterMinutes} min at $195 an hour`, i.inv.extraTime));
  if (i.inv.samples > 0) Line.push(line(`Lab samples (${i.samples} at $85)`, i.inv.samples));
  if (i.inv.extras > 0) Line.push(line("Other charges", i.inv.extras));
  if (i.inv.deposit > 0) Line.push(line("Deposit received", -i.inv.deposit));
  return {
    CustomerRef: { value: i.customerId },
    TxnDate: i.txnDate,
    DueDate: i.dueDate,
    ...(i.email ? { BillEmail: { Address: i.email } } : {}),
    Line,
  };
}
