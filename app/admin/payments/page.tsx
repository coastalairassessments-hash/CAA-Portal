import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/pricing";
import { todayInNewYork } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Payments | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

const KIND: Record<string, string> = { deposit: "Deposit", balance: "Balance", link: "Payment link" };
const day = (iso: string) => todayInNewYork(new Date(iso));

async function Body() {
  await connection();
  const supabase = await supabaseForUser();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");

  const { data, error } = await supabase
    .from("payments")
    .select("id, kind, name, amount_cents, paid_at, request_id")
    .order("paid_at", { ascending: false })
    .limit(300);
  if (error) {
    return <p className="adm-err">{error.code === "42P01" ? "Not set up yet. Run the 0028 SQL in Supabase." : "Could not load payments."}</p>;
  }
  const rows = data ?? [];
  const month = todayInNewYork(new Date()).slice(0, 7);
  const thisMonth = rows.filter((r) => day(r.paid_at).startsWith(month)).reduce((n, r) => n + r.amount_cents, 0);

  return (
    <>
      <div className="adm-tiles">
        <div className="adm-tile"><b>{formatMoney(thisMonth)}</b><span>Cards paid this month</span></div>
        <div className="adm-tile"><b>{rows.length}</b><span>Payments listed</span></div>
      </div>
      <p className="adm-muted">Card payments only, as Stripe collected them, before Stripe fees. Cash and checks are marked paid on the job. Payments from before today are not listed.</p>
      {rows.length === 0 && <p className="adm-empty">No card payments recorded yet.</p>}
      {rows.map((r) => (
        <article className="adm-card" key={r.id}>
          <h2>{r.name || "Client"} · {formatMoney(r.amount_cents)}</h2>
          <p className="adm-line">{KIND[r.kind] ?? r.kind} · {day(r.paid_at)}</p>
          {r.request_id && <a className="adm-btn" href={`/admin/${r.request_id}`}>Open job</a>}
        </article>
      ))}
    </>
  );
}

export default function PaymentsPage() {
  return (
    <main className="adm-wrap">
      <header className="adm-top"><h1 className="adm-title">Payments</h1></header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Body />
      </Suspense>
    </main>
  );
}
