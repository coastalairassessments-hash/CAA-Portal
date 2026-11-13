import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { getCheckout, isStripeId } from "@/lib/stripePay";
import { formatMoney } from "@/lib/pricing";
import { deletePaymentLink, sendPaymentLink } from "./actions";

export const metadata: Metadata = {
  title: "Payment links | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Q = Record<string, string | string[] | undefined>;

async function Body({ searchParams }: { searchParams: Promise<Q> }) {
  await connection();
  const supabase = await supabaseForUser();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");
  const q = await searchParams;
  const one = (k: string) => (typeof q[k] === "string" ? (q[k] as string).slice(0, 200) : "");

  const { data: rows, error } = await supabase.from("payment_links").select("*").order("created_at", { ascending: false }).limit(60);
  const list = rows ?? [];
  // Notice payments that came in since the last visit.
  await Promise.all(
    list.filter((r) => !r.paid_at && isStripeId(r.stripe_id)).map(async (r) => {
      try {
        if ((await getCheckout(r.stripe_id)).paid) {
          r.paid_at = new Date().toISOString();
          await supabase.from("payment_links").update({ paid_at: r.paid_at }).eq("id", r.id).is("paid_at", null);
        }
      } catch { /* shows as unpaid until the next visit */ }
    }),
  );
  const owed = list.filter((r) => !r.paid_at).reduce((s, r) => s + r.amount_cents, 0);

  return (
    <>
      {error && <p className="adm-err">{error.code === "42P01" ? "Not set up yet. Run the 0026 SQL in Supabase." : "Could not load the list."}</p>}
      {q.sent && <p className="adm-ok">Sent. The client has a card link by email.</p>}
      {q.unsent && <p className="adm-err">The link was made but the email did not go out. Check that the email address is right.</p>}
      {one("error") && <p className="adm-err" role="alert">{one("error")}</p>}
      <form action={sendPaymentLink} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="adm-field"><label htmlFor="name">Client name</label><input id="name" name="name" defaultValue={one("name")} required /></div>
        <div className="adm-field"><label htmlFor="email">Client email</label><input id="email" name="email" type="email" defaultValue={one("email")} required /></div>
        <div className="adm-field"><label htmlFor="description">What it is for</label><input id="description" name="description" defaultValue={one("description")} placeholder="Invoice #12979, PRV, Oct 16" required /></div>
        <div className="adm-field"><label htmlFor="amount">Amount ($)</label><input id="amount" name="amount" inputMode="decimal" defaultValue={one("amount")} required /></div>
        <button className="adm-btn primary wide" type="submit">Email card link</button>
      </form>
      <p className="adm-muted" style={{ marginTop: 16 }}>Looking for the email? <Link href="/admin/clients">Search clients</Link> and copy it.</p>
      {list.length > 0 && <h2 style={{ marginTop: 20 }}>Sent{owed > 0 ? ` · ${formatMoney(owed)} unpaid` : ""}</h2>}
      {list.map((r) => (
        <article className="adm-card" key={r.id}>
          <h2>{r.name} · {formatMoney(r.amount_cents)}</h2>
          <p className="adm-muted">{r.description}</p>
          <p className="adm-line">{r.paid_at ? "Paid" : r.sent_at ? "Sent, waiting for payment" : "Not emailed"} · {r.email}</p>
          {!r.paid_at && (
            <form action={deletePaymentLink}>
              <input type="hidden" name="id" value={r.id} />
              <button className="adm-btn" type="submit">Cancel this link</button>
            </form>
          )}
        </article>
      ))}
    </>
  );
}

export default function LinksPage(props: { searchParams: Promise<Q> }) {
  return (
    <main className="adm-wrap">
      <header className="adm-top"><h1 className="adm-title">Payment links</h1></header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Body {...props} />
      </Suspense>
    </main>
  );
}
