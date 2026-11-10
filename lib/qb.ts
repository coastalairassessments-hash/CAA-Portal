// QuickBooks Online connection (pure helpers). The app only talks to QuickBooks; it keeps
// nothing that QuickBooks already holds. Tokens are stored by lib/qbStore.ts.
export const QB_SCOPE = "com.intuit.quickbooks.accounting";
const AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
export const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();

export type QbConfig = {
  clientId: string;
  clientSecret: string;
  env: "sandbox" | "production";
  redirectUri: string;
};

export function qbConfig(env: Record<string, string | undefined> = process.env): QbConfig {
  const clientId = clean(env.QB_CLIENT_ID);
  const clientSecret = clean(env.QB_CLIENT_SECRET);
  if (!clientId || !clientSecret) throw new Error("Missing QB_CLIENT_ID or QB_CLIENT_SECRET");
  const site = clean(env.SITE_URL) || "https://book.coastalairassessments.com";
  return {
    clientId,
    clientSecret,
    env: clean(env.QB_ENV) === "production" ? "production" : "sandbox",
    redirectUri: `${site.replace(/\/+$/, "")}/api/qb/callback`,
  };
}

export function authorizeUrl(c: QbConfig, state: string): string {
  const q = new URLSearchParams({
    client_id: c.clientId,
    response_type: "code",
    scope: QB_SCOPE,
    redirect_uri: c.redirectUri,
    state,
  });
  return `${AUTH_URL}?${q.toString()}`;
}

export const apiBase = (c: Pick<QbConfig, "env">) =>
  c.env === "production" ? "https://quickbooks.api.intuit.com" : "https://sandbox-quickbooks.api.intuit.com";

export const basicAuth = (c: Pick<QbConfig, "clientId" | "clientSecret">) =>
  "Basic " + Buffer.from(`${c.clientId}:${c.clientSecret}`).toString("base64");

export type TokenReply = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
};

// Turns Intuit's reply into the dates we store. Refresh a little early so calls never fail.
export function tokenDates(r: Pick<TokenReply, "expires_in" | "x_refresh_token_expires_in">, now = Date.now()) {
  return {
    access_expires_at: new Date(now + (r.expires_in - 120) * 1000).toISOString(),
    refresh_expires_at: new Date(now + r.x_refresh_token_expires_in * 1000).toISOString(),
  };
}

// The "state" value proves the sign-in came from us. It is signed, so no cookie is needed
// (cookies are lost when the app and the browser are different places on a phone).
import { createHmac, timingSafeEqual } from "node:crypto";

const sign = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest("hex").slice(0, 32);

export function makeState(secret: string, now = Date.now()): string {
  const body = String(now);
  return `${body}.${sign(body, secret)}`;
}

export function checkState(state: string | null, secret: string, now = Date.now(), maxAgeMs = 15 * 60_000): boolean {
  if (!state) return false;
  const [body, sig] = state.split(".");
  if (!body || !sig || !/^\d+$/.test(body)) return false;
  const want = sign(body, secret);
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return false;
  const age = now - Number(body);
  return age >= 0 && age <= maxAgeMs;
}
