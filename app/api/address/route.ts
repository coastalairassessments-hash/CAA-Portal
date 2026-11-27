import { NextResponse, connection } from "next/server";
import { parseComponents, parseSuggestions } from "@/lib/address";
import { makeThrottle } from "@/lib/http";

// Address help for the request form. Without a key it quietly returns nothing and the form works as plain typing.
const KEY = () => process.env.GOOGLE_PLACES_KEY?.trim().replace(/^["']+|["']+$/g, "");
// Each keystroke pause is one paid Google call, and this route is open to anyone. This slows a script
// that hammers it; the key itself should also be limited to the Places API with a daily cap in Google Cloud.
const throttle = makeThrottle(40, 60_000);
function callerKey(req: Request) {
  return (req.headers.get("x-nf-client-connection-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown").trim();
}
const none = () => NextResponse.json({ suggestions: [] }, { headers: { "Cache-Control": "no-store" } });

export async function GET(req: Request) {
  await connection();
  const key = KEY();
  if (!key) return none();
  if (!throttle.take(callerKey(req))) return NextResponse.json({ suggestions: [], place: null }, { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": "60" } });
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
