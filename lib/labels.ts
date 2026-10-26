// Plain-English labels for the list page. Pure functions, easy to test.
const ISSUE_LABELS: Record<string, string> = {
  musty_smell: "Musty smell",
  water_damage: "Water damage",
  post_remediation: "After mold cleanup (PRV)",
  air_quality: "Air quality concern",
  other: "Other",
};

const SIZE_LABELS: Record<string, string> = {
  under_2000: "Under 2,000 sq ft",
  "2000_4000": "2,000 to 4,000 sq ft",
  "4000_6000": "4,000 to 6,000 sq ft",
  over_6000: "Over 6,000 sq ft",
};

export const issueLabel = (v: string) => ISSUE_LABELS[v] ?? v;
export const sizeLabel = (v: string) => SIZE_LABELS[v] ?? v;

// "+17725550142" -> "(772) 555-0142"
export function formatPhone(e164: string): string {
  const m = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

// "12:30" -> "12:30 PM", "10:00" -> "10:00 AM"
export function formatTime(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (!m) return hhmm;
  const h = Number(m[1]);
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
}

// "2026-10-26T23:41:00Z" -> "Oct 26 at 7:41 PM" (Eastern time)
export function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(d);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(d);
  return `${date} at ${time}`;
}
