// SERVER ONLY. Contractor sign-in by emailed link, and the session that follows.
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, SITE_URL_FALLBACK } from "./notify";
import { PHONE, SIGNOFF } from "./business";
import { COOKIE, SESSION_DAYS, hashToken, loginExpiry, newToken, parseEmail, sessionExpiry, validToken } from "./contractorAuth";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();
export const siteUrl = () => clean(process.env.SITE_URL) || SITE_URL_FALLBACK;

export function loginEmail(name: string, link: string) {
  return {
    subject: "Your sign-in link",
    text: [
      `Hi ${name.split(/\s+/)[0] || "there"},`,
      "",
      "Here is your sign-in link for Coastal Air Assessments. It works once and expires in 15 minutes:",
      link,
      "",
      `Did not ask for this? Ignore it. Questions? Call or text ${PHONE}.`,
      "",
      ...SIGNOFF,
    ].join("\n"),
  };
}

// Always looks the same from outside, so nobody can use this form to learn which emails are contractors.
export async function sendLoginLink(db: SupabaseClient, rawEmail: string): Promise<void> {
  const e = parseEmail(rawEmail);
  if (!e.success) return;
  const { data: c } = await db.from("contractors").select("id, name").eq("email", e.data).eq("portal_active", true).maybeSingle();
  if (!c) return;
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await db.from("contractor_logins").select("id", { count: "exact", head: true }).eq("contractor_id", c.id).gte("created_at", since);
  if ((count ?? 0) >= 5) return;
  const token = newToken();
  const { error } = await db.from("contractor_logins").insert({ contractor_id: c.id, token_hash: await hashToken(token), expires_at: loginExpiry() });
  if (error) return;
  await sendEmail({ to: e.data, ...loginEmail(c.name, `${siteUrl().replace(/\/+$/, "")}/contractor/verify?t=${token}`) });
}

// Spends a link. Returns the contractor, or null when it is wrong, used or expired.
export async function consumeLogin(db: SupabaseClient, token: unknown): Promise<string | null> {
  if (!validToken(token)) return null;
  const { data } = await db
    .from("contractor_logins")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", await hashToken(token))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("contractor_id")
    .maybeSingle();
  return data?.contractor_id ?? null;
}

export async function startSession(db: SupabaseClient, contractorId: string): Promise<boolean> {
  const token = newToken();
  const { error } = await db.from("contractor_sessions").insert({ contractor_id: contractorId, token_hash: await hashToken(token), expires_at: sessionExpiry() });
  if (error) return false;
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/contractor", maxAge: SESSION_DAYS * 86_400 });
  return true;
}

export async function currentContractor(db: SupabaseClient): Promise<{ id: string; name: string; email: string | null } | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!validToken(token)) return null;
  const { data: s } = await db
    .from("contractor_sessions")
    .select("contractor_id")
    .eq("token_hash", await hashToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!s) return null;
  const { data: c } = await db.from("contractors").select("id, name, email").eq("id", s.contractor_id).eq("portal_active", true).maybeSingle();
  return c ?? null;
}

export async function endSession(db: SupabaseClient) {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (validToken(token)) await db.from("contractor_sessions").delete().eq("token_hash", await hashToken(token));
  jar.delete(COOKIE);
}
