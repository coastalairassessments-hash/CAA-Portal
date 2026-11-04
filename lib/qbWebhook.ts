// QuickBooks tells us "something changed" with a signed note. The note only prompts a check;
// what we act on is always read back from QuickBooks, never taken from the note.
import { createHmac, timingSafeEqual } from "node:crypto";

// The signature is the base64 HMAC-SHA256 of the raw body, keyed with the verifier token.
export function validSignature(rawBody: string, header: string | null, verifier: string | undefined): boolean {
  if (!verifier || !header) return false;
  const want = createHmac("sha256", verifier).update(rawBody).digest();
  let got: Buffer;
  try {
    got = Buffer.from(header, "base64");
  } catch {
    return false;
  }
  return got.length === want.length && timingSafeEqual(got, want);
}

// Does the note mention a payment or invoice? Anything else needs no action.
export function touchesMoney(rawBody: string): boolean {
  try {
    const body = JSON.parse(rawBody) as { eventNotifications?: { dataChangeEvent?: { entities?: { name?: string }[] } }[] };
    return (body.eventNotifications ?? []).some((n) =>
      (n.dataChangeEvent?.entities ?? []).some((e) => e.name === "Payment" || e.name === "Invoice" || e.name === "SalesReceipt"),
    );
  } catch {
    return false;
  }
}
