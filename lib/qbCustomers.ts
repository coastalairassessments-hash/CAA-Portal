// Pure helpers for reading QuickBooks customers (the client directory).
export type Client = { id: string; name: string; phone: string; email: string; address: string };

// QuickBooks query strings use single quotes; escape them and drop wildcard characters.
export function customerQuery(term: string): string | null {
  const t = term.trim().replace(/[%_\\]/g, " ").replace(/'/g, "\\'").replace(/\s+/g, " ").slice(0, 60).trim();
  if (t.length < 2) return null;
  return `select * from Customer where DisplayName like '%${t}%' or CompanyName like '%${t}%' orderby DisplayName maxresults 15`;
}

type Raw = {
  Id?: string;
  DisplayName?: string;
  PrimaryPhone?: { FreeFormNumber?: string };
  Mobile?: { FreeFormNumber?: string };
  PrimaryEmailAddr?: { Address?: string };
  BillAddr?: { Line1?: string; City?: string; CountrySubDivisionCode?: string; PostalCode?: string };
  ShipAddr?: { Line1?: string; City?: string; CountrySubDivisionCode?: string; PostalCode?: string };
};

export function mapCustomers(reply: unknown): Client[] {
  const list = (reply as { QueryResponse?: { Customer?: Raw[] } })?.QueryResponse?.Customer ?? [];
  return list
    .filter((c) => c.Id && c.DisplayName)
    .map((c) => {
      const a = c.ShipAddr?.Line1 ? c.ShipAddr : c.BillAddr;
      const tail = [a?.City, [a?.CountrySubDivisionCode, a?.PostalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
      return {
        id: c.Id as string,
        name: c.DisplayName as string,
        phone: c.Mobile?.FreeFormNumber || c.PrimaryPhone?.FreeFormNumber || "",
        email: c.PrimaryEmailAddr?.Address || "",
        address: [a?.Line1, tail].filter(Boolean).join(", "),
      };
    });
}

export const telDigits = (p: string) => p.replace(/[^\d+]/g, "");
