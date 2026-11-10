// SERVER ONLY. Stores the QuickBooks tokens (service key) and makes authorized calls.
import { createClient } from "@supabase/supabase-js";
import { TOKEN_URL, apiBase, basicAuth, qbConfig, tokenDates, type TokenReply } from "./qb";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();

function db() {
  const url = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

type Conn = {
  realm_id: string;
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
  refresh_expires_at: string;
};

export async function getConnection(): Promise<Conn | null> {
  const { data, error } = await db().from("qb_connection").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return (data as Conn | null) ?? null;
}

export async function saveConnection(realmId: string, r: TokenReply) {
  const { error } = await db().from("qb_connection").upsert({
    id: 1,
    realm_id: realmId,
    access_token: r.access_token,
    refresh_token: r.refresh_token,
    ...tokenDates(r),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// Intuit asks us to keep this id from every reply: it lets their support trace a problem.
const tidOf = (res: Response) => res.headers.get("intuit_tid") ?? "none";

export class QbReconnectError extends Error {
  constructor(message = "QuickBooks needs to be reconnected") {
    super(message);
    this.name = "QbReconnectError";
  }
}

export async function tokenRequest(form: Record<string, string>): Promise<TokenReply> {
  const c = qbConfig();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuth(c),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams(form).toString(),
    cache: "no-store",
  });
  if (!res.ok) {
    // Intuit says why in a short code (such as invalid_grant). It holds no secrets, so keep it.
    let why = "";
    try {
      const b = (await res.json()) as { error?: string; error_description?: string };
      why = [b.error, b.error_description].filter(Boolean).join(": ").slice(0, 160);
    } catch {
      /* no readable reason */
    }
    console.error(`QuickBooks token error ${res.status} ${form.grant_type} ${why} intuit_tid=${tidOf(res)}`);
    // A refused refresh token (expired or revoked) cannot fix itself: the owner reconnects.
    if (form.grant_type === "refresh_token" && (res.status === 400 || res.status === 401)) throw new QbReconnectError();
    throw new Error(`QuickBooks token error ${res.status}${why ? ` - ${why}` : ""}`);
  }
  return (await res.json()) as TokenReply;
}

// Intuit gives a NEW refresh token every time one is used, and the old one stops working.
// So two refreshes at once (a page load and the 5-minute check, say) would break the connection.
// Within one server we share a single refresh; across servers we re-read what the winner saved.
let inFlight: Promise<{ token: string; realm: string }> | null = null;

async function refresh(): Promise<{ token: string; realm: string }> {
  const conn = await getConnection();
  if (!conn) throw new QbReconnectError("QuickBooks is not connected");
  if (Date.parse(conn.refresh_expires_at) <= Date.now()) throw new QbReconnectError();
  try {
    const fresh = await tokenRequest({ grant_type: "refresh_token", refresh_token: conn.refresh_token });
    await saveConnection(conn.realm_id, fresh);
    return { token: fresh.access_token, realm: conn.realm_id };
  } catch (e) {
    if (!(e instanceof QbReconnectError)) throw e;
    // Another server may have just renewed it. If the stored token changed, use the newer one.
    const latest = await getConnection();
    if (!latest || latest.refresh_token === conn.refresh_token) throw e;
    if (Date.parse(latest.access_expires_at) > Date.now() + 30_000) {
      return { token: latest.access_token, realm: latest.realm_id };
    }
    const fresh = await tokenRequest({ grant_type: "refresh_token", refresh_token: latest.refresh_token });
    await saveConnection(latest.realm_id, fresh);
    return { token: fresh.access_token, realm: latest.realm_id };
  }
}

// A valid access token, refreshed when it is about to expire (or when forced after a 401).
async function ready(force = false): Promise<{ token: string; realm: string }> {
  const conn = await getConnection();
  if (!conn) throw new QbReconnectError("QuickBooks is not connected");
  if (!force && Date.parse(conn.access_expires_at) > Date.now() + 60_000) return { token: conn.access_token, realm: conn.realm_id };
  if (!inFlight) inFlight = refresh().finally(() => { inFlight = null; });
  return inFlight;
}

// True when the stored connection can no longer refresh itself, so the owner must reconnect.
export function connectionExpired(conn: { refresh_expires_at: string }, now = Date.now()): boolean {
  return Date.parse(conn.refresh_expires_at) <= now;
}

export async function qbFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const call = async (force: boolean) => {
    const { token, realm } = await ready(force);
    return fetch(`${apiBase(qbConfig())}/v3/company/${realm}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(init.headers ?? {}) },
      cache: "no-store",
    });
  };
  let res = await call(false);
  // The token can be rejected before its clock runs out. Refresh once and try again.
  if (res.status === 401) res = await call(true);
  if (!res.ok) {
    console.error(`QuickBooks error ${res.status} intuit_tid=${tidOf(res)} path=${path.split("?")[0]}`);
    if (res.status === 401) throw new QbReconnectError();
    // QuickBooks says why in its reply. Keep the short reason so a failure can be understood.
    let why = "";
    try {
      const body = (await res.json()) as { Fault?: { Error?: { Message?: string; Detail?: string }[] } };
      const e = body.Fault?.Error?.[0];
      why = [e?.Message, e?.Detail].filter(Boolean).join(": ").slice(0, 240);
    } catch {
      /* no readable reason */
    }
    throw new Error(`QuickBooks error ${res.status}${why ? ` - ${why}` : ""} (intuit_tid ${tidOf(res)})`);
  }
  return res.json();
}
