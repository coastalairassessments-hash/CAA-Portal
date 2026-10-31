import { TIME_ZONE, todayInNewYork } from "./dates";
import { progress } from "./stage";

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
  booking_mode?: string | null;
  client_type?: string | null;
  en_route_at?: string | null;
  arrived_at?: string | null;
  left_at?: string | null;
  final_paid_at?: string | null;
  final_invoice_no?: string | null;
  cancel_refund?: boolean | null;
  refunded_at?: string | null;
};

export const TABS = ["motion", "requests", "booked", "owed", "done", "declined", "all"] as const;
export type Tab = (typeof TABS)[number];

export function parseTab(v: string | string[] | undefined): Tab {
  const s = Array.isArray(v) ? v[0] : v;
  return (TABS as readonly string[]).includes(s ?? "") ? (s as Tab) : "motion";
}

const sortKey = (r: AdminRow) =>
  (r.status === "confirmed" || r.status === "offered") && r.confirmed_date
    ? `${r.confirmed_date} ${r.confirmed_time ?? ""}`
    : "";

export function filterRows(rows: AdminRow[], tab: Tab): AdminRow[] {
  switch (tab) {
    case "motion": {
      // Everyone still in play. What needs Cory first, then soonest job, then newest request.
      const today = todayInNewYork();
      const now = new Date();
      const live = rows.filter((r) => progress(r, today, now).alive);
      return live.sort((a, b) => {
        const rank = (r: AdminRow) => (r.status === "new" ? 0 : progress(r, today, now).warn ? 1 : 2);
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
        const ka = sortKey(a);
        const kb = sortKey(b);
        if (ka && kb) return ka.localeCompare(kb);
        if (ka) return -1;
        if (kb) return 1;
        return b.created_at.localeCompare(a.created_at);
      });
    }
    case "done":
      return rows
        .filter((r) => r.status === "confirmed" && !!r.final_paid_at)
        .sort((a, b) => (b.final_paid_at ?? "").localeCompare(a.final_paid_at ?? ""));
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
    case "owed":
      // Finished visits that are not paid yet, oldest first.
      return rows
        .filter((r) => r.status === "confirmed" && !!r.left_at && !r.final_paid_at)
        .sort((a, b) => (a.left_at ?? "").localeCompare(b.left_at ?? ""));
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
