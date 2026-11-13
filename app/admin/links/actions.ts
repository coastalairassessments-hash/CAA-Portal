"use server";
import { redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import { parsePaymentLink, paymentLinkEmail } from "@/lib/paymentLink";
import { createCheckout, expireCheckout, isStripeId, stripeConfigured } from "@/lib/stripePay";
import { siteBase } from "@/lib/finalPay";
import { sendEmail } from "@/lib/notify";

async function adminClient() {
  const supabase = await supabaseForUser();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: ok } = await supabase.rpc("is_admin");
  return ok ? supabase : null;
}

// Make the card page, email the client, and mark the row sent. Shared by "send now" and "send a saved one".
async function deliver(supabase: NonNullable<Awaited<ReturnType<typeof adminClient>>>, row: { id: string; token: string; name: string; email: string; description: string; amount_cents: number }): Promise<boolean | null> {
  const link = `${siteBase()}/pay/${row.token}`;
  try {
    const made = await createCheckout({
      cents: row.amount_cents,
      description: `${row.description} - Coastal Air Assessments`,
      email: row.email,
      requestId: row.id,
      successUrl: link,
      cancelUrl: link,
    });
    const mail = paymentLinkEmail({ name: row.name, description: row.description, cents: row.amount_cents, link });
    const sent = (await sendEmail({ to: row.email, ...mail })).ok;
    await supabase.from("payment_links").update({ stripe_id: made.id, email: row.email, sent_at: sent ? new Date().toISOString() : null }).eq("id", row.id);
    return sent;
  } catch (e) {
    console.error("[links] could not make the payment page:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function sendPaymentLink(form: FormData): Promise<void> {
  const supabase = await adminClient();
  if (!supabase) redirect("/admin");
  const draft = form.get("then") === "draft";
  const parsed = parsePaymentLink(
    { name: form.get("name") ?? "", email: form.get("email") ?? "", description: form.get("description") ?? "", amount: form.get("amount") ?? "" },
    !draft,
  );
  if (!parsed.success) redirect(`/admin/links?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the form")}`);
  if (!draft && !stripeConfigured()) redirect("/admin/links?error=Card payments are not set up");
  const v = parsed.data;

  const { data: row, error } = await supabase.from("payment_links").insert(v).select("id, token").single();
  if (error || !row) redirect(`/admin/links?error=${encodeURIComponent(error?.code === "42P01" ? "Run the 0026 SQL in Supabase first" : "That did not save")}`);
  if (draft) redirect("/admin/links?saved=1");

  const sent = await deliver(supabase, { ...row, name: v.name, email: v.email as string, description: v.description, amount_cents: v.amount_cents });
  if (sent === null) {
    await supabase.from("payment_links").delete().eq("id", row.id);
    redirect("/admin/links?error=The card link could not be made. Nothing was sent.");
  }
  redirect(`/admin/links?${sent ? "sent" : "unsent"}=1`);
}

// Send one that was saved earlier. The email can be typed or fixed here.
export async function sendSavedLink(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/links");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 200) redirect("/admin/links?error=Type the client's email first");
  if (!stripeConfigured()) redirect("/admin/links?error=Card payments are not set up");
  const { data: r } = await supabase.from("payment_links").select("id, token, name, description, amount_cents, paid_at, sent_at").eq("id", id).maybeSingle();
  if (!r || r.paid_at) redirect("/admin/links");
  const sent = await deliver(supabase, { ...r, email });
  if (sent === null) redirect("/admin/links?error=The card link could not be made. Nothing was sent.");
  redirect(`/admin/links?${sent ? "sent" : "unsent"}=1`);
}

export async function deletePaymentLink(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin/links");
  const { data: r } = await supabase.from("payment_links").select("stripe_id, paid_at").eq("id", id).maybeSingle();
  if (r && !r.paid_at) {
    if (isStripeId(r.stripe_id)) await expireCheckout(r.stripe_id as string).catch(() => undefined);
    await supabase.from("payment_links").delete().eq("id", id);
  }
  redirect("/admin/links");
}
