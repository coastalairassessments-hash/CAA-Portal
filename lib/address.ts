// Turns Google Places answers into what the form needs. Pure, so it is easy to test.
export type Suggestion = { id: string; text: string };
export type Parsed = { address: string; city: string; zip: string };

type AutocompleteResponse = { suggestions?: { placePrediction?: { placeId?: string; text?: { text?: string } } }[] };
type Component = { longText?: string; shortText?: string; types?: string[] };

export function parseSuggestions(body: unknown): Suggestion[] {
  const list = (body as AutocompleteResponse)?.suggestions ?? [];
  const out: Suggestion[] = [];
  for (const s of list) {
    const id = s.placePrediction?.placeId;
    const text = s.placePrediction?.text?.text;
    if (id && text) out.push({ id, text });
  }
  return out.slice(0, 5);
}

export function parseComponents(body: unknown): Parsed | null {
  const comps = ((body as { addressComponents?: Component[] })?.addressComponents ?? []) as Component[];
  const get = (type: string) => comps.find((c) => c.types?.includes(type))?.longText ?? "";
  const number = get("street_number");
  const route = get("route");
  const unit = get("subpremise");
  const street = [number, route].filter(Boolean).join(" ") + (unit ? ` #${unit}` : "");
  const city = get("locality") || get("sublocality") || get("postal_town");
  const zip = get("postal_code");
  if (!street.trim()) return null;
  return { address: street.trim(), city, zip };
}
