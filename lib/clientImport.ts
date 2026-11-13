// Reads a client export (Jobber or QuickBooks CSV) into rows for the clients table. Pure.
export type ClientRow = { key: string; name: string; phone: string | null; phone_digits: string | null; email: string | null; address: string | null; source: string };

// A small CSV reader that handles quoted commas, quotes and line breaks.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
const pick = (r: Record<string, string>, names: string[]) => {
  for (const n of names) { const v = (r[norm(n)] ?? "").trim(); if (v) return v; }
  return "";
};

export function cleanPhone(raw: string): { phone: string; digits: string } | null {
  const m = raw.match(/\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{4}/);
  if (!m) return null;
  const d = m[0].replace(/\D/g, "");
  return { phone: `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`, digits: d };
}

export function cleanEmail(raw: string): string | null {
  const m = raw.match(/[^\s,;<>]+@[^\s,;<>]+\.[^\s,;<>]+/);
  return m ? m[0].toLowerCase() : null;
}

export function mapClients(csv: string, source: string): ClientRow[] {
  const table = parseCsv(csv);
  if (table.length < 2) return [];
  const head = table[0].map(norm);
  const out = new Map<string, ClientRow>();
  for (const cells of table.slice(1)) {
    const r: Record<string, string> = {};
    head.forEach((h, i) => { r[h] = cells[i] ?? ""; });
    if (["true", "yes"].includes((r.archived ?? "").toLowerCase())) continue;
    const first = pick(r, ["First Name"]);
    const last = pick(r, ["Last Name"]);
    const name = pick(r, ["Display Name", "Customer full name", "Full name", "Customer", "Name", "Company Name"]) || `${first} ${last}`.trim();
    if (!name) continue;
    const ph = cleanPhone(pick(r, ["Main Phone #s", "Mobile Phone #s", "Phone", "Phone Numbers", "Mobile", "Other Phone #s"]) || pick(r, ["Mobile Phone #s"]));
    const email = cleanEmail(pick(r, ["E-mails", "Email", "Emails"]));
    const street = [pick(r, ["Service Street 1", "Billing Street 1", "Street Address", "Billing address", "Bill address"]), pick(r, ["Service Street 2", "Billing Street 2"])].filter(Boolean).join(" ");
    const city = pick(r, ["Service City", "Billing City", "City"]);
    const st = pick(r, ["Service State", "Billing State", "State"]);
    const zip = pick(r, ["Service Zip code", "Billing Zip code", "Zip", "Zip code"]);
    const address = [street, [city, [st, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")].filter(Boolean).join(", ") || null;
    // Name plus contact, so two people who share an email or phone stay separate.
    const key = `${name.toLowerCase().replace(/\s+/g, " ")}|${email ?? ph?.digits ?? ""}`;
    if (!out.has(key)) out.set(key, { key, name, phone: ph?.phone ?? null, phone_digits: ph?.digits ?? null, email, address, source });
  }
  return [...out.values()];
}
