import { NextResponse, connection } from "next/server";
import { parseComponents, parseSuggestions } from "@/lib/address";

// Address help for the request form. Without a key it quietly returns nothing and the form works as plain typing.
const KEY = () => process.env.GOOGLE_PLACES_KEY?.trim().replace(/^["']+|["']+$/g, "");
const none = () => NextResponse.json({ suggestions: [] }, { headers: { "Cache-Control": "no-store" } });

export async function GET(req: Request) {
  await connection();
  const key = KEY();
  if (!key) return none();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const q = (url.searchParams.get("q") ?? "").trim();

  try {
    if (id) {
      if (!/^[A-Za-z0-9_-]{10,200}$/.test(id)) return NextResponse.json({ place: null });
      const res = await fetch(`https://places.googleapis.com/v1/places/${id}`, {
        headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "addressComponents" },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return NextResponse.json({ place: null });
      return NextResponse.json({ place: parseComponents(await res.json()) }, { headers: { "Cache-Control": "no-store" } });
    }
    if (q.length < 4 || q.length > 120) return none();
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
      body: JSON.stringify({
        input: q,
        includedRegionCodes: ["us"],
        includedPrimaryTypes: ["street_address", "premise", "subpremise"],
        locationBias: { circle: { center: { latitude: 27.1975, longitude: -80.2528 }, radius: 50000 } },
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return none();
    return NextResponse.json({ suggestions: parseSuggestions(await res.json()) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return none();
  }
}
