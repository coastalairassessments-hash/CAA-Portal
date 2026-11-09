// Drive time between visits. Pure, so every rule is easy to test.
// Zones are counties. ZIP lists and minutes are approximate and meant to be tuned by Cory.
import { addDays, weekdayOf, BOOKABLE_WEEKDAYS } from "./dates";
import type { Slot } from "./slots";

export type DriveZone = "palm-beach" | "martin" | "st-lucie" | "indian-river" | "brevard";

export const ZONE_LABEL: Record<DriveZone, string> = {
  "palm-beach": "Palm Beach",
  martin: "Martin",
  "st-lucie": "St. Lucie",
  "indian-river": "Indian River",
  brevard: "Brevard",
};

const MARTIN = ["34997", "34990", "34957", "33455", "34994", "34996", "34956", "33475", "34992", "34991", "34995", "34958"];
const ST_LUCIE = [
  "34945", "34946", "34947", "34948", "34949", "34950", "34951", "34952", "34953", "34954", "34979", "34981",
  "34982", "34983", "34984", "34985", "34986", "34987", "34988",
];
const INDIAN_RIVER = [
  "32948", "32957", "32958", "32959", "32960", "32961", "32962", "32963", "32964", "32965", "32966", "32967",
  "32968", "32969", "32970", "32971", "32976",
];
const BREVARD = [
  "32754", "32775", "32780", "32781", "32783", "32796", "32899", "32901", "32902", "32903", "32904", "32905",
  "32906", "32907", "32908", "32909", "32910", "32911", "32912", "32919", "32920", "32922", "32923", "32924",
  "32925", "32926", "32927", "32931", "32934", "32935", "32936", "32937", "32940", "32941", "32949", "32950",
  "32951", "32952", "32953", "32954", "32955",
];

// Palm Beach County ZIPs run 33401 to 33499, and 334xx is all Palm Beach except a few Martin ZIPs listed above.
export function driveZone(zip: string | null | undefined): DriveZone | null {
  const z = (zip ?? "").trim().slice(0, 5);
  if (!/^\d{5}$/.test(z)) return null;
  if (MARTIN.includes(z)) return "martin";
  if (ST_LUCIE.includes(z)) return "st-lucie";
  if (INDIAN_RIVER.includes(z)) return "indian-river";
  if (BREVARD.includes(z)) return "brevard";
  if (/^334\d\d$/.test(z)) return "palm-beach";
  return null;
}

// Minutes by road between the middle of each county, with a little traffic cushion.
const PAIRS: Record<string, number> = {
  "palm-beach|martin": 50,
  "palm-beach|st-lucie": 70,
  "palm-beach|indian-river": 105,
  "palm-beach|brevard": 140,
  "martin|st-lucie": 35,
  "martin|indian-river": 65,
  "martin|brevard": 100,
  "st-lucie|indian-river": 40,
  "st-lucie|brevard": 70,
  "indian-river|brevard": 40,
};
export const SAME_ZONE_MINUTES = 20;
// Time to wrap up and get on the road.
export const BUFFER_MINUTES = 10;

export function driveMinutes(a: DriveZone, b: DriveZone): number {
  if (a === b) return SAME_ZONE_MINUTES;
  return PAIRS[`${a}|${b}`] ?? PAIRS[`${b}|${a}`] ?? SAME_ZONE_MINUTES;
}

const mins = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export type Zoned = Slot & { zone?: DriveZone | null };

export type TooFar = { first: Zoned; second: Zoned; drive: number; gap: number; need: number };

// Is the gap between two visits on the same day too short to drive?
// Visits that overlap are handled elsewhere. Whole-day visits (over 2 hours) are handled there too.
export function tooFar(a: Zoned, b: Zoned): TooFar | null {
  if (a.date !== b.date || !a.zone || !b.zone) return null;
  const [first, second] = mins(a.time) <= mins(b.time) ? [a, b] : [b, a];
  const gap = mins(second.time) - (mins(first.time) + first.hours * 60);
  if (gap < 0) return null; // overlapping: the normal double-booking rule covers it
  const drive = driveMinutes(first.zone!, second.zone!);
  const need = drive + BUFFER_MINUTES;
  return gap < need ? { first, second, drive, gap, need } : null;
}

// The first conflict a new visit would have with visits already held.
export function driveConflict(held: Zoned[], want: Zoned): TooFar | null {
  for (const h of held) {
    const t = tooFar(h, want);
    if (t) return t;
  }
  return null;
}

// The closest bookable days (Mon-Thu) where this visit has no drive conflict and nothing overlaps.
export function nearestOkDays(
  held: Zoned[],
  want: Zoned,
  overlapsFn: (a: Slot, b: Slot) => boolean,
  count = 3,
  reach = 21,
): string[] {
  const out: { date: string; dist: number }[] = [];
  for (let d = 1; d <= reach; d++) {
    for (const date of [addDays(want.date, -d), addDays(want.date, d)]) {
      if (!BOOKABLE_WEEKDAYS.includes(weekdayOf(date))) continue;
      const cand = { ...want, date };
      if (held.some((h) => overlapsFn(h, cand))) continue;
      if (driveConflict(held, cand)) continue;
      out.push({ date, dist: d });
    }
  }
  out.sort((x, y) => x.dist - y.dist || x.date.localeCompare(y.date));
  return out.slice(0, count).map((o) => o.date);
}

export function hm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

// One plain sentence for Cory.
export function conflictText(t: TooFar): string {
  const a = ZONE_LABEL[t.first.zone!];
  const b = ZONE_LABEL[t.second.zone!];
  return `${b} is about ${hm(t.drive)} from your ${t.first.time} ${a} visit. You would have ${hm(Math.max(t.gap, 0))} between visits and need about ${hm(t.need)}.`;
}
