import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { formatDateLabel, todayInNewYork } from "@/lib/dates";
import { formatTime, fullAddress, jobLabel, sizeLabel } from "@/lib/labels";
import {
  counts,
  filterRows,
  mapsLink,
  parseTab,
  todayLabel,
  type AdminRow,
  type Tab,
} from "@/lib/admin";

export const metadata: Metadata = {
  title: "Your day | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const TAB_LABELS: Record<Tab, string> = { requests: "Requests", booked: "Booked jobs", owed: "Finished, not paid", declined: "Declined and cancelled", all: "All" };
const EMPTY: Record<Tab, string> = {
  requests: "Nothing waiting. You're caught up.",
  owed: "Nothing owed. Every finished job is paid.",
  booked: "No booked jobs yet.",
  declined: "Nothing here.",
  all: "No requests yet.",
};

function Card({ r }: { r: AdminRow }) {
  const booked = (r.status === "confirmed" || r.status === "offered") && r.confirmed_date && r.confirmed_time;
  return (
    <article className={`adm-card${r.area === "outside" ? " outside" : ""}`}>
      <h2>{r.name}</h2>
      <div className="adm-chips">
        {r.status === "confirmed" && r.left_at && !r.final_paid_at && (
          <span className="adm-chip warn">{r.final_invoice_no ? "Invoiced, unpaid" : "Send invoice"}</span>
        )}
        {r.source === "contractor" && <span className="adm-chip">Contractor</span>}
        {r.status === "confirmed" && <span className="adm-chip solid">Booked</span>}
        {r.status === "offered" && <span className="adm-chip warn">Deposit waiting</span>}
        {r.status === "declined" && <span className="adm-chip">Declined</span>}
        {r.status === "cancelled" && !r.cancel_refund && <span className="adm-chip">Cancelled</span>}
        {r.status === "cancelled" && r.cancel_refund && !r.refunded_at && <span className="adm-chip warn">Refund due</span>}
        {r.status === "cancelled" && r.cancel_refund && r.refunded_at && <span className="adm-chip">Cancelled, refunded</span>}
        {r.area === "outside" && <span className="adm-chip warn">Outside area</span>}
      </div>
      <p className="adm-line">
        {jobLabel(r)}
        {r.size_band ? ` · ${sizeLabel(r.size_band)}` : ""}
      </p>
      <p className="adm-muted">
        {booked
          ? `${r.status === "offered" ? "Offered" : "Booked"} ${formatDateLabel(r.confirmed_date!)} at ${formatTime(r.confirmed_time!)} · ${r.block_hours}h`
          : `Wants ${formatDateLabel(r.preferred_date)} at ${formatTime(r.preferred_time)}`}{" "}
        · {r.city ? `${r.city} ${r.zip ?? ""}` : r.address}
      </p>
      <div className="adm-actions">
        {r.phone ? <a className="adm-btn" href={`tel:${r.phone}`}>Call</a> : <span className="adm-btn" aria-disabled="true" style={{ opacity: 0.45 }}>Call</span>}
        {r.phone && r.text_consent ? (
          <a className="adm-btn" href={`sms:${r.phone}`}>Text</a>
        ) : (
          <span className="adm-btn" aria-disabled="true" style={{ opacity: 0.45 }}>Text</span>
        )}
        <a className="adm-btn" href={mapsLink(r)}>Navigate</a>
        <Link className="adm-btn primary" href={`/admin/${r.id}`}>Open</Link>
      </div>
    </article>
  );
}

// Today's date is computed fresh on each visit.
async function TodayDate() {
  await connection();
  return <>{todayLabel()}</>;
}

async function Dashboard({ searchParams }: Props) {
  const tab = parseTab((await searchParams).tab);
  const supabase = await supabaseForUser();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <p className="adm-err">
        This account is signed in but is not on the admin list. Add it to admin_users in Supabase.
      </p>
    );
  }

  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, created_at, status, issue, size_band, preferred_date, preferred_time, name, phone, email, address, city, zip, notes, text_consent, confirmed_date, confirmed_time, block_hours, area, source, cancel_refund, refunded_at, left_at, final_paid_at, final_invoice_no",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return <p className="adm-err">Could not load requests. (Ref: list-{error.code ?? "unknown"})</p>;

  const all = (data ?? []) as AdminRow[];
  const c = counts(all, todayInNewYork());
  const rows = filterRows(all, tab);

  return (
    <>
      <div className="adm-stats">
        <div className={`adm-stat${c.new > 0 ? " hot" : ""}`}><b>{c.new}</b><span>New requests</span></div>
        <div className={`adm-stat${c.waiting > 0 ? " hot" : ""}`}><b>{c.waiting}</b><span>Deposit waiting</span></div>
        <div className="adm-stat"><b>{c.upcoming}</b><span>Upcoming jobs</span></div>
      </div>
      <h2 className="adm-sub">{TAB_LABELS[tab]}</h2>
      {rows.length === 0 ? (
        <p className="adm-empty">{EMPTY[tab]}</p>
      ) : (
        rows.map((r) => <Card key={r.id} r={r} />)
      )}
    </>
  );
}

export default function AdminPage(props: Props) {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <div>
          <div className="adm-date">
            <Suspense fallback={null}>
              <TodayDate />
            </Suspense>
          </div>
          <h1 className="adm-title">Your day</h1>
        </div>
      </header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Dashboard {...props} />
      </Suspense>
    </main>
  );
}
