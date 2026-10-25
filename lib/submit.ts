import { createHash } from "node:crypto";
import { parseRequest } from "./request";
import { classifyZip } from "./zones";

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
  text_consent: boolean;
  area: "core" | "outside";
  zone_id: string | null;
  ip_hash: string | null;
};

export type SubmitDeps = {
  countRecentByIp: (ipHash: string, sinceIso: string) => Promise<number>;
  insert: (row: NewRequestRow) => Promise<{ id: string }>;
  notify: (row: NewRequestRow & { id: string }) => Promise<void>;
  ipSalt: string;
  now?: () => Date;
};

export type SubmitResult =
  | { ok: true }
  | { ok: false; status: 400; errors: Record<string, string> }
  | { ok: false; status: 429; error: string }
  | { ok: false; status: 500; error: string };

// Spam slow-down: at most this many requests per device per hour.
export const MAX_PER_HOUR = 3;

function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
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
    const recent = await deps.countRecentByIp(ipHash, since);
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
    text_consent: data.textConsent,
    area: zone.area,
    zone_id: zone.zoneId,
    ip_hash: ipHash,
  };

  let id: string;
  try {
    ({ id } = await deps.insert(row));
  } catch {
    return {
      ok: false,
      status: 500,
      error: "Something went wrong on our end. Please call us and we'll take it from here.",
    };
  }

  // A failed alert must never lose or fail the request.
  try {
    await deps.notify({ ...row, id });
  } catch {
    // swallow: the request is saved and visible in the list
  }

  return { ok: true };
}
