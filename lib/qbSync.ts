// SERVER ONLY. The few things we ask QuickBooks to do. QuickBooks keeps the clients and the money.
import { qbFetch, getConnection } from "./qbStore";
import { customerPayload, qbEscape, readInvoice, type ClientRow } from "./qbInvoice";

const q = (sql: string) => `/query?query=${encodeURIComponent(sql)}&minorversion=70`;
const post = (path: string, body: unknown) =>
  qbFetch(`${path}${path.includes("?") ? "&" : "?"}minorversion=70`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const qbConnected = async (): Promise<boolean> => {
  try {
    return !!(await getConnection());
  } catch {
    return false;
  }
};

// The QuickBooks customer id for this client: reuse a match by name, otherwise create one.
export async function ensureCustomer(r: ClientRow): Promise<string> {
  const found = (await qbFetch(q(`select Id from Customer where DisplayName = '${qbEscape(r.name.trim())}'`))) as {
    QueryResponse?: { Customer?: { Id: string }[] };
  };
  const hit = found.QueryResponse?.Customer?.[0]?.Id;
  if (hit) return hit;
  const made = (await post("/customer", customerPayload(r))) as { Customer?: { Id: string } };
  if (!made.Customer?.Id) throw new Error("QuickBooks did not return a customer");
  return made.Customer.Id;
}

// One generic service item that every invoice line uses.
export async function ensureServiceItem(): Promise<string> {
  const name = "CAA Services";
  const found = (await qbFetch(q(`select Id from Item where Name = '${name}'`))) as {
    QueryResponse?: { Item?: { Id: string }[] };
  };
  const hit = found.QueryResponse?.Item?.[0]?.Id;
  if (hit) return hit;
  const acct = (await qbFetch(q("select Id from Account where AccountType = 'Income' maxresults 1"))) as {
    QueryResponse?: { Account?: { Id: string }[] };
  };
  const income = acct.QueryResponse?.Account?.[0]?.Id;
  if (!income) throw new Error("No income account in QuickBooks");
  const made = (await post("/item", { Name: name, Type: "Service", IncomeAccountRef: { value: income } })) as {
    Item?: { Id: string };
  };
  if (!made.Item?.Id) throw new Error("QuickBooks did not return an item");
  return made.Item.Id;
}

export async function createInvoice(payload: unknown): Promise<{ id: string; number: string }> {
  const made = (await post("/invoice", payload)) as { Invoice?: { Id: string; DocNumber?: string } };
  if (!made.Invoice?.Id) throw new Error("QuickBooks did not return an invoice");
  return { id: made.Invoice.Id, number: made.Invoice.DocNumber ?? "" };
}

// Emails the invoice from QuickBooks (with its pay link when Payments is on).
export async function emailInvoice(id: string, to?: string | null): Promise<boolean> {
  try {
    const sendTo = to ? `?sendTo=${encodeURIComponent(to)}` : "";
    await qbFetch(`/invoice/${id}/send${sendTo}${sendTo ? "&" : "?"}minorversion=70`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
    });
    return true;
  } catch {
    return false;
  }
}

// One invoice: how much is still owed, the client's pay link, and the token needed to change it.
export async function getInvoice(id: string) {
  const reply = await qbFetch(`/invoice/${encodeURIComponent(id)}?include=invoiceLink&minorversion=70`);
  return readInvoice(reply);
}

// Cancels an unpaid invoice so it does not sit open in the books.
export async function voidInvoice(id: string): Promise<boolean> {
  try {
    const inv = await getInvoice(id);
    if (!inv || inv.balance === 0) return false;
    await post("/invoice?operation=void", { Id: id, SyncToken: inv.syncToken });
    return true;
  } catch {
    return false;
  }
}
