// SERVER ONLY. Client sign-in by emailed link, and the session that follows. Same design as contractorServer.ts.
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "./notify";
import { PHONE, SIGNOFF } from "./business";
import { siteUrl } from "./contractorServer";
import { CLIENT_COOKIE, MAX_LINKS_PER_HOUR, SESSION_DAYS, hashToken, loginExpiry, newToken, parseEmail, sessionExpiry, validToken } from "./clientAuth";

export function clientLoginEmail(name: string | null, link: string) {
  return {
    subject: "Your sign-in link",
    text: [
      `Hi ${(name ?? "").trim().split(/\s+/)[0] || "there"},`,
      "",
      "Here is your sign-in link for your Coastal Air Assessments portal. It works once and expires in 15 minutes:",
      link,
      "",
      `Did not ask for this? Ignore it. Questions? Call or text ${PHONE}.`,
      "",
      ...SIGNOFF,
    ].join("\n"),
  };
}

// Always looks the same from outside, so nobody can use this form to learn who our clients are.
export async function sendClientLink(db: SupabaseClient, rawEmail: string): Promise<void> {
  const e = parseEmail(rawEmail);
  if (!e.success) return;
  const { data: c } = await db.from("clients").select("id, name").eq("email", e.data).maybeSingle();
  if (!c) return;
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db.from("client_logins").select("id", { count: "exact", head: true }).eq("client_id", c.id).gte("created_at", since);
  if ((count ?? 0) >= MAX_LINKS_PER_HOUR) return;
  const token = newToken();
  const { error } = await db.from("client_logins").insert({ client_id: c.id, token_hash: await hashToken(token), expires_at: loginExpiry() });
  if (error) return;
  await sendEmail({ to: e.data, ...clientLoginEmail(c.name, `${siteUrl().replace(/\/+$/, "")}/portal/verify?t=${token}`) });
}

// Spends a link. Returns the client, or null when it is wrong, used or expired.
export async function consumeClientLogin(db: SupabaseClient, token: unknown): Promise<string | null> {
  if (!validToken(token)) return null;
  const { data } = await db
    .from("client_logins")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", await hashToken(token))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("client_id")
    .maybeSingle();
  return data?.client_id ?? null;
}

export async function startClientSession(db: SupabaseClient, clientId: string): Promise<boolean> {
  const token = newToken();
  const { error } = await db.from("client_sessions").insert({ client_id: clientId, token_hash: await hashToken(token), expires_at: sessionExpiry() });
  if (error) return false;
  (await cookies()).set(CLIENT_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/portal", maxAge: SESSION_DAYS * 86_400 });
  return true;
}

export async function currentClient(db: SupabaseClient): Promise<{ id: string; name: string | null; email: string } | null> {
  const token = (await cookies()).get(CLIENT_COOKIE)?.value;
  if (!validToken(token)) return null;
  const { data: s } = await db
    .from("client_sessions")
    .select("client_id")
    .eq("token_hash", await hashToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!s) return null;
  const { data: c } = await db.from("clients").select("id, name, email").eq("id", s.client_id).maybeSingle();
  return c ?? null;
}

export async function endClientSession(db: SupabaseClient) {
  const jar = await cookies();
  const token = jar.get(CLIENT_COOKIE)?.value;
  if (validToken(token)) await db.from("client_sessions").delete().eq("token_hash", await hashToken(token));
  jar.delete(CLIENT_COOKIE);
}
