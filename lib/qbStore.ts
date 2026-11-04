// SERVER ONLY. Stores the QuickBooks tokens (service key) and makes authorized calls.
import { createClient } from "@supabase/supabase-js";
import { open, seal } from "./secretBox";
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
  if (!data) return null;
  const c = data as Conn;
  return { ...c, access_token: open(c.access_token), refresh_token: open(c.refresh_token) };
}

export async function saveConnection(realmId: string, r: TokenReply) {
  const { error } = await db().from("qb_connection").upsert({
    id: 1,
    realm_id: realmId,
    access_token: seal(r.access_token),
    refresh_token: seal(r.refresh_token),
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
    console.error(`QuickBooks token error ${res.status} intuit_tid=${tidOf(res)}`);
    // A refused refresh token (expired or revoked) cannot fix itself: the owner reconnects.
    if (form.grant_type === "refresh_token" && (res.status === 400 || res.status === 401)) throw new QbReconnectError();
    throw new Error(`QuickBooks token error ${res.status}`);
  }
  return (await res.json()) as TokenReply;
}

// A valid access token, refreshed when it is about to expire (or when forced after a 401).
async function ready(force = false): Promise<{ token: string; realm: string }> {
  const conn = await getConnection();
  if (!conn) throw new QbReconnectError("QuickBooks is not connected");
  if (!force && Date.parse(conn.access_expires_at) > Date.now()) return { token: conn.access_token, realm: conn.realm_id };
  if (Date.parse(conn.refresh_expires_at) <= Date.now()) throw new QbReconnectError();
  const fresh = await tokenRequest({ grant_type: "refresh_token", refresh_token: conn.refresh_token });
  await saveConnection(conn.realm_id, fresh);
  return { token: fresh.access_token, realm: conn.realm_id };
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
    throw new Error(`QuickBooks error ${res.status} (intuit_tid ${tidOf(res)})`);
  }
  return res.json();
}
