// Service zones live in this settings list, not in page code.
// To add a second service area later: add one more entry to ZONES (no rebuild of logic).
// ZIP is a proxy for county: a few ZIPs straddle county lines, so Cory can edit these lists.
// Source: zip-codes.com county lists (Oct 2026).

export type Zone = {
  id: string;
  name: string;
  zips: readonly string[];
};

export const ZONES: readonly Zone[] = [
  {
    id: "martin",
    name: "Martin County",
    zips: [
      "34997", "34990", "34957", "33455", "34994", "34996", "34956",
      "33475", "34992", "34991", "34995", "34958",
    ],
  },
  {
    id: "st-lucie",
    name: "St. Lucie County",
    zips: [
      "34945", "34946", "34947", "34948", "34949", "34950", "34951", "34952",
      "34953", "34954", "34979", "34981", "34982", "34983", "34984", "34985",
      "34986", "34987", "34988",
    ],
  },
  {
    id: "palm-beach",
    name: "Palm Beach County",
    zips: [
      "33401", "33402", "33403", "33404", "33405", "33406", "33407", "33408",
      "33409", "33410", "33411", "33412", "33413", "33414", "33415", "33416",
      "33417", "33418", "33419", "33420", "33421", "33422", "33424", "33425",
      "33426", "33427", "33428", "33429", "33430", "33431", "33432", "33433",
      "33434", "33435", "33436", "33437", "33438", "33444", "33445", "33446",
      "33448", "33449", "33454", "33458", "33460", "33461", "33462", "33463",
      "33464", "33465", "33466", "33467", "33468", "33469", "33470", "33472",
      "33473", "33474", "33476", "33477", "33478", "33480", "33481", "33482",
      "33483", "33484", "33486", "33487", "33488", "33493", "33496", "33497",
      "33498", "33499",
    ],
  },
];

export type ZoneResult =
  | { area: "core"; zoneId: string; zoneName: string }
  | { area: "outside"; zoneId: null; zoneName: null };

// Internal only: the client never sees this result.
export function classifyZip(
  zip: string,
  zones: readonly Zone[] = ZONES,
): ZoneResult {
  const clean = zip.trim().slice(0, 5);
  for (const zone of zones) {
    if (zone.zips.includes(clean)) {
      return { area: "core", zoneId: zone.id, zoneName: zone.name };
    }
  }
  return { area: "outside", zoneId: null, zoneName: null };
}
