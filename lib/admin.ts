import { TIME_ZONE } from "./dates";

// Pure helpers for the dashboard: filtering, counts, links.
export type AdminRow = {
  id: string;
  created_at: string;
  status: string;
  issue: string;
  size_band: string;
  preferred_date: string;
  preferred_time: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  notes: string;
  text_consent: boolean;
  confirmed_date: string | null;
  confirmed_time: string | null;
  block_hours: number | null;
  area: "core" | "outside";
};

export const TABS = ["new", "booked", "declined", "all"] as const;
export type Tab = (typeof TABS)[number];

export function parseTab(v: string | string[] | undefined): Tab {
  const s = Array.isArray(v) ? v[0] : v;
  return (TABS as readonly string[]).includes(s ?? "") ? (s as Tab) : "new";
}

const sortKey = (r: AdminRow) =>
  r.status === "confirmed" && r.confirmed_date
    ? `${r.confirmed_date} ${r.confirmed_time ?? ""}`
    : "";

export function filterRows(rows: AdminRow[], tab: Tab): AdminRow[] {
  switch (tab) {
    case "new":
      return rows.filter((r) => r.status === "new");
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
    outside: rows.filter((r) => r.status === "new" && r.area === "outside").length,
  };
}

// Opens Apple Maps on iPhone and Mac with directions to the job.
export function mapsLink(r: { address: string; city: string; zip: string }): string {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(`${r.address}, ${r.city} FL ${r.zip}`)}`;
}

export function todayLabel(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: TIME_ZONE,
  }).format(now);
}
