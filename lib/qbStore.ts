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
  if (!res.ok) throw new Error(`QuickBooks token error ${res.status}`);
  return (await res.json()) as TokenReply;
}

// A valid access token, refreshed when it is about to expire.
async function ready(): Promise<{ token: string; realm: string }> {
  const conn = await getConnection();
  if (!conn) throw new Error("QuickBooks is not connected");
  if (Date.parse(conn.access_expires_at) > Date.now()) return { token: conn.access_token, realm: conn.realm_id };
  const fresh = await tokenRequest({ grant_type: "refresh_token", refresh_token: conn.refresh_token });
  await saveConnection(conn.realm_id, fresh);
  return { token: fresh.access_token, realm: conn.realm_id };
}

export async function qbFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const { token, realm } = await ready();
  const res = await fetch(`${apiBase(qbConfig())}/v3/company/${realm}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`QuickBooks error ${res.status}`);
  return res.json();
}
