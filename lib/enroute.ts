// Sent the moment Cory taps "On my way".
import { bookingLine } from "./confirm";
import { PHONE, SIGNOFF } from "./business";
import { SITE_URL_FALLBACK } from "./notify";

export function enRouteEmail(row: { name: string; public_token?: string | null }, siteUrl: string = SITE_URL_FALLBACK) {
  const first = row.name.trim().split(/\s+/)[0] || "there";
  return {
    subject: "We are on the way",
    text: [
      `Hi ${first},`,
      "",
      "We just left for your address and will be there soon.",
      "",
      ...bookingLine(row, siteUrl).map((l) => l.replace("Your booking, any time:", "Follow along:")),
      `Need us? Call or text ${PHONE}.`,
      "",
      ...SIGNOFF,
    ].join("\n"),
  };
}
