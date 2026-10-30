// SERVER ONLY. Sends an alert to Cory's phone(s). Never throws; returns how many phones got it.
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();
export type PushMsg = { title: string; body: string; url?: string };

export const pushConfigured = () => !!(clean(process.env.VAPID_PUBLIC_KEY) && clean(process.env.VAPID_PRIVATE_KEY));

export async function sendPush(msg: PushMsg): Promise<number> {
  const pub = clean(process.env.VAPID_PUBLIC_KEY);
  const priv = clean(process.env.VAPID_PRIVATE_KEY);
  const url = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!pub || !priv || !url || !key) return 0;
  try {
    webpush.setVapidDetails(clean(process.env.VAPID_SUBJECT) || `mailto:${clean(process.env.ALERT_EMAIL) || "info@coastalairassessments.com"}`, pub, priv);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data } = await db.from("push_subscriptions").select("endpoint, p256dh, auth");
    let sent = 0;
    for (const s of data ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(msg));
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
      }
    }
    return sent;
  } catch {
    return 0;
  }
}
