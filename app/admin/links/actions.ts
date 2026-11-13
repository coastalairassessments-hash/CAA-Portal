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

export async function sendPaymentLink(form: FormData): Promise<void> {
  const supabase = await adminClient();
  if (!supabase) redirect("/admin");
  const parsed = parsePaymentLink({
    name: form.get("name") ?? "",
    email: form.get("email") ?? "",
    description: form.get("description") ?? "",
    amount: form.get("amount") ?? "",
  });
  if (!parsed.success) redirect(`/admin/links?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the form")}`);
  if (!stripeConfigured()) redirect("/admin/links?error=Card payments are not set up");
  const v = parsed.data;

  const { data: row, error } = await supabase.from("payment_links").insert(v).select("id, token").single();
  if (error || !row) redirect(`/admin/links?error=${encodeURIComponent(error?.code === "42P01" ? "Run the 0026 SQL in Supabase first" : "That did not save")}`);

  const link = `${siteBase()}/pay/${row.token}`;
  let sent = false;
  try {
    const made = await createCheckout({
      cents: v.amount_cents,
      description: `${v.description} - Coastal Air Assessments`,
      email: v.email,
      requestId: row.id,
      successUrl: link,
      cancelUrl: link,
    });
    const mail = paymentLinkEmail({ name: v.name, description: v.description, cents: v.amount_cents, link });
    sent = (await sendEmail({ to: v.email, ...mail })).ok;
    await supabase.from("payment_links").update({ stripe_id: made.id, sent_at: sent ? new Date().toISOString() : null }).eq("id", row.id);
  } catch (e) {
    console.error("[links] could not make the payment page:", e instanceof Error ? e.message : e);
    await supabase.from("payment_links").delete().eq("id", row.id);
    redirect("/admin/links?error=The card link could not be made. Nothing was sent.");
  }
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
