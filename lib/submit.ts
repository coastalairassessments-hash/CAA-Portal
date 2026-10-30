import { createHash } from "node:crypto";
import { parseRequest } from "./request";
import { classifyZip } from "./zones";
import { TERMS_VERSION } from "./terms";
import { POLICY_VERSION } from "./policy";
import { canBookInstantly, hoursFor } from "./instant";
import { depositCents } from "./pricing";
import type { Slot } from "./slots";

// Row shape matches the `requests` table (supabase/migrations/0001_requests.sql).
export type NewRequestRow = {
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
  how_heard: string | null;
  client_type: string;
  property_type: string | null;
  company: string | null;
  intake: Record<string, string>;
  text_consent: boolean;
  terms_version: string;
  terms_accepted_at: string;
  policy_version: string;
  policy_accepted_at: string;
  area: "core" | "outside";
  zone_id: string | null;
  ip_hash: string | null;
  // Set only when the client books and pays right away.
  status?: "offered";
  booking_mode?: "instant";
  confirmed_date?: string;
  confirmed_time?: string;
  block_hours?: number;
  offered_at?: string;
  deposit_cents?: number;
};

export type SubmitDeps = {
  countRecentByIp: (ipHash: string, sinceIso: string) => Promise<number>;
  insert: (row: NewRequestRow) => Promise<{ id: string; public_token?: string | null }>;
  notify: (row: NewRequestRow & { id: string; public_token?: string | null }) => Promise<void>;
  ipSalt: string;
  now?: () => Date;
  // Instant booking. Left out, every request simply waits for Cory, as before.
  slotHeld?: (slot: Slot) => Promise<boolean>;
  startPayment?: (row: NewRequestRow & { id: string; public_token?: string | null }) => Promise<void>;
  revertToRequest?: (id: string) => Promise<void>;
};

export type SubmitResult =
  | { ok: true; instant?: boolean; token?: string | null }
  | { ok: false; status: 409; errors: Record<string, string> }
  | { ok: false; status: 400; errors: Record<string, string> }
  | { ok: false; status: 429; error: string }
  | { ok: false; status: 500; error: string };

// Spam slow-down: at most this many requests per device per hour.
export const MAX_PER_HOUR = 3;

function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

// Short, safe-to-show code for support, e.g. "insert-42501". Never includes personal data.
export function errorRef(stage: string, err: unknown): string {
  let code = "unknown";
  if (typeof err === "object" && err !== null) {
    const c = (err as { code?: unknown }).code;
    const m = String((err as { message?: unknown }).message ?? "");
    if (typeof c === "string" && c) code = c;
    else if (/invalid api key|jwt|apikey/i.test(m)) code = "auth";
    else if (/fetch failed|enotfound|network|invalid url/i.test(m)) code = "network";
  }
  return `${stage}-${code}`;
}

function logFailure(stage: string, err: unknown) {
  const message = err instanceof Error ? err.message : String((err as { message?: unknown })?.message ?? err);
  console.error(`[submit] ${stage} failed: ${message}`);
}

export async function submitRequest(
  input: unknown,
  ip: string | null,
  deps: SubmitDeps,
): Promise<SubmitResult> {
  const now = (deps.now ?? (() => new Date()))();

  // Bot trap: a filled hidden field gets a fake "success" and is never stored.
  if (
    typeof input === "object" &&
    input !== null &&
    typeof (input as Record<string, unknown>).website === "string" &&
    ((input as Record<string, unknown>).website as string).length > 0
  ) {
    return { ok: true };
  }

  const parsed = parseRequest(input, now);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return { ok: false, status: 400, errors };
  }
  const data = parsed.data;

  const ipHash = ip ? hashIp(ip, deps.ipSalt) : null;
  if (ipHash) {
    const since = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    let recent = 0;
    try {
      recent = await deps.countRecentByIp(ipHash, since);
    } catch (err) {
      // Spam protection must never block a real client. Log it and carry on.
      logFailure("spam-check", err);
    }
    if (recent >= MAX_PER_HOUR) {
      return {
        ok: false,
        status: 429,
        error:
          "We've received several requests from this connection. Please try again later or give us a call.",
      };
    }
  }

  // Internal only. Never returned to the client.
  const zone = classifyZip(data.zip);

  // Can they book and pay right now? Bigger or outside jobs wait for Cory to confirm the price.
  const instant =
    !!deps.startPayment && !!deps.slotHeld &&
    canBookInstantly({ area: zone.area, propertyType: data.propertyType, sizeBand: data.sizeBand });
  const hours = hoursFor(data.issue, data.sizeBand);
  if (instant && (await deps.slotHeld!({ date: data.preferredDate, time: data.preferredTime, hours }))) {
    return {
      ok: false,
      status: 409,
      errors: { preferredDate: "That time was just taken. Please pick another." },
    };
  }

  const row: NewRequestRow = {
    issue: data.issue,
    size_band: data.sizeBand,
    preferred_date: data.preferredDate,
    preferred_time: data.preferredTime,
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    zip: data.zip,
    notes: data.notes,
    how_heard: data.howHeard ?? null,
    client_type: data.clientType,
    property_type: data.propertyType ?? null,
    company: data.company || null,
    // Keep only the answers that were filled in.
    intake: Object.fromEntries(Object.entries(data.details).filter(([, v]) => typeof v === "string" && v !== "")) as Record<string, string>,
    text_consent: data.textConsent,
    terms_version: TERMS_VERSION,
    terms_accepted_at: now.toISOString(),
    policy_version: POLICY_VERSION,
    policy_accepted_at: now.toISOString(),
    area: zone.area,
    zone_id: zone.zoneId,
    ip_hash: ipHash,
    ...(instant
      ? {
          status: "offered" as const,
          booking_mode: "instant" as const,
          confirmed_date: data.preferredDate,
          confirmed_time: data.preferredTime,
          block_hours: hours,
          offered_at: now.toISOString(),
          deposit_cents: depositCents(data.issue),
        }
      : {}),
  };

  let id: string;
  let token: string | null | undefined;
  try {
    ({ id, public_token: token } = await deps.insert(row));
  } catch (err) {
    logFailure("insert", err);
    return {
      ok: false,
      status: 500,
      error: `Something went wrong on our end. Please call us and we'll take it from here. (Ref: ${errorRef("insert", err)})`,
    };
  }

  // Booking and paying: the payment page takes over, and Cory hears when the deposit lands.
  if (instant) {
    try {
      await deps.startPayment!({ ...row, id, public_token: token });
      return { ok: true, instant: true, token };
    } catch (err) {
      // Payments are down or not connected. Never lose the client: turn it into a normal request.
      logFailure("start-payment", err);
      try {
        await deps.revertToRequest?.(id);
      } catch (e) {
        logFailure("revert", e);
      }
    }
  }

  // A failed alert must never lose or fail the request.
  try {
    await deps.notify({ ...row, id, public_token: token });
  } catch {
    // swallow: the request is saved and visible in the list
  }

  return { ok: true };
}
