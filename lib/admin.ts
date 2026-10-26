import { TIME_ZONE } from "./dates";

// Pure helpers for the dashboard: filtering, counts, links.
export type AdminRow = {
  id: string;
  created_at: string;
  status: string;
  issue: string;
  size_band: string | null;
  preferred_date: string;
  preferred_time: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string;
  city: string | null;
  zip: string | null;
  source: string;
  notes: string;
  text_consent: boolean;
  confirmed_date: string | null;
  confirmed_time: string | null;
  block_hours: number | null;
  area: "core" | "outside";
  cancel_refund?: boolean | null;
  refunded_at?: string | null;
};

export const TABS = ["requests", "booked", "declined", "all"] as const;
export type Tab = (typeof TABS)[number];

export function parseTab(v: string | string[] | undefined): Tab {
  const s = Array.isArray(v) ? v[0] : v;
  return (TABS as readonly string[]).includes(s ?? "") ? (s as Tab) : "requests";
}

const sortKey = (r: AdminRow) =>
  (r.status === "confirmed" || r.status === "offered") && r.confirmed_date
    ? `${r.confirmed_date} ${r.confirmed_time ?? ""}`
    : "";

export function filterRows(rows: AdminRow[], tab: Tab): AdminRow[] {
  switch (tab) {
    case "requests":
      // New first, then deposits waiting (soonest date first).
      return [
        ...rows.filter((r) => r.status === "new"),
        ...rows
          .filter((r) => r.status === "offered")
          .sort((a, b) => sortKey(a).localeCompare(sortKey(b))),
      ];
    case "booked":
      // Soonest job first.
      return rows
        .filter((r) => r.status === "confirmed")
        .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    case "declined":
      return rows.filter((r) => r.status === "declined" || r.status === "cancelled");
    default:
      return rows;
  }
}

export function counts(rows: AdminRow[], today: string) {
  return {
    new: rows.filter((r) => r.status === "new").length,
    upcoming: rows.filter(
      (r) => r.status === "confirmed" && r.confirmed_date && r.confirmed_date >= today,
    ).length,
    waiting: rows.filter((r) => r.status === "offered").length,
    outside: rows.filter((r) => r.status === "new" && r.area === "outside").length,
  };
}

// Opens Apple Maps on iPhone and Mac with directions to the job.
export function mapsLink(r: { address: string; city?: string | null; zip?: string | null }): string {
  const where = r.city ? `${r.address}, ${r.city} FL ${r.zip ?? ""}`.trim() : r.address;
  return `https://maps.apple.com/?daddr=${encodeURIComponent(where)}`;
}

export function todayLabel(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: TIME_ZONE,
  }).format(now);
}
