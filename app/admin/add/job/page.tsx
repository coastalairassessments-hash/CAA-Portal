import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { todayInNewYork } from "@/lib/dates";
import Link from "next/link";
import AddForm from "../AddForm";
import { balanceCents, type DashRow } from "@/lib/dashboard";
import { CONTRACTOR_TERMS_VERSION } from "@/lib/contractorTerms";
import { formatDateLabel } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Add a job | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

async function Loader({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const supabase = await supabaseForUser();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");
  const { data } = await supabase.from("contractors").select("id, name, email, terms_accepted_at, terms_version").order("name");
  // Trip fees not yet paid: due before the next visit, so they are flagged when you schedule that contractor again.
  const { data: trips } = await supabase
    .from("requests")
    .select("id, status, issue, source, name, contractor_id, confirmed_date, left_at, arrived_at, deposit_cents, deposit_paid_at, lab_samples, extras_cents, trip_only, final_paid_at, final_invoice_no, cancel_refund, refunded_at")
    .eq("source", "contractor").eq("status", "confirmed").eq("trip_only", true).not("left_at", "is", null).is("final_paid_at", null);
  const owed = new Map<string, { cents: number; date: string }>();
  for (const t of (trips ?? []) as unknown as (DashRow & { contractor_id: string })[]) {
    const prev = owed.get(t.contractor_id);
    owed.set(t.contractor_id, { cents: (prev?.cents ?? 0) + Math.max(balanceCents(t), 0), date: prev?.date ?? (t.confirmed_date ? formatDateLabel(t.confirmed_date) : "") });
  }
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).slice(0, 200) : "");
  return <AddForm contractors={(data ?? []).map((c) => ({ id: c.id, name: c.name, hasEmail: !!c.email, accepted: c.terms_version === CONTRACTOR_TERMS_VERSION && !!c.terms_accepted_at, tripOwedCents: owed.get(c.id)?.cents ?? 0, tripOwedDate: owed.get(c.id)?.date ?? "" }))} defaultDate={/^\d{4}-\d{2}-\d{2}$/.test(pick("date")) ? pick("date") : todayInNewYork()} defaultTime={/^(10:00|12:30)$/.test(pick("time")) ? pick("time") : "10:00"} initialOutcome={pick("mode") === "done" ? "done" : pick("mode") === "trip" ? "trip" : ""} initialName={pick("name")} initialAddress={pick("address")} initialKind={pick("kind") === "homeowner" ? "homeowner" : "contractor"} initialPhone={pick("phone")} initialEmail={pick("email")} />;
}

export default function AddPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1 className="adm-title">Add a job</h1>
        <Link className="adm-link" href="/admin/add">Back to Add</Link>
      </header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Loader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
