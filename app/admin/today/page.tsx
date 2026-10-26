import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { addDays, formatDateLabel, todayInNewYork } from "@/lib/dates";
import { formatTime, fullAddress, jobLabel } from "@/lib/labels";
import { mapsLink, todayLabel, type AdminRow } from "@/lib/admin";
import { onMyWayText, runningLateText, smsLink } from "@/lib/confirm";
import { stampTime } from "../actions";

export const metadata: Metadata = {
  title: "Today | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
type Job = AdminRow & { arrived_at: string | null; left_at: string | null };

function Stamp({ id, which, done, label }: { id: string; which: "arrived_at" | "left_at"; done: boolean; label: string }) {
  return (
    <form action={stampTime}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="which" value={which} />
      <input type="hidden" name="back" value="today" />
      {done && <input type="hidden" name="clear" value="1" />}
      <button className={`adm-btn wide${done ? "" : " primary"}`} type="submit" style={{ minHeight: 48 }}>
        {done ? `${label} ✓` : label}
      </button>
    </form>
  );
}

function JobCard({ r, today }: { r: Job; today: boolean }) {
  const contractor = r.source === "contractor";
  const canText = !!r.phone && r.text_consent;
  const slot = { name: r.name };
  return (
    <article className="adm-card">
      <div className="adm-job-time">{formatTime(r.confirmed_time!)}</div>
      <div className="adm-chips">
        <span className={`adm-chip${contractor ? "" : " solid"}`}>{contractor ? "Contractor" : "Homeowner"}</span>
        {contractor ? <span className="adm-chip warn">Invoice after</span> : <span className="adm-chip">Deposit paid</span>}
      </div>
      <h2>{r.name}</h2>
      <p className="adm-line">{jobLabel(r)} · about {r.block_hours} {r.block_hours === 1 ? "hour" : "hours"}</p>
      <p className="adm-muted">{fullAddress(r)}</p>
      <div className="adm-actions three">
        <a className="adm-btn primary" href={mapsLink(r)}>Navigate</a>
        {r.phone ? <a className="adm-btn" href={`tel:${r.phone}`}>Call</a> : <span className="adm-btn" aria-disabled="true" style={{ opacity: 0.45 }}>Call</span>}
        <Link className="adm-btn" href={`/admin/${r.id}`}>Open</Link>
      </div>
      {today && (
        <div className="adm-row" style={{ marginTop: 8 }}>
          <Stamp id={r.id} which="arrived_at" done={!!r.arrived_at} label="Arrived" />
          <Stamp id={r.id} which="left_at" done={!!r.left_at} label="Left" />
        </div>
      )}
      {today && canText && (
        <div className="adm-row" style={{ marginTop: 8 }}>
          <a className="adm-btn" href={smsLink(r.phone!, onMyWayText(slot))}>Text: on my way</a>
          <a className="adm-btn" href={smsLink(r.phone!, runningLateText(slot))}>Text: running late</a>
        </div>
      )}
    </article>
  );
}

async function Schedule({ searchParams }: Props) {
  const q = await searchParams;
  const week = q.range === "week";
  const supabase = await supabaseForUser();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");

  const today = todayInNewYork();
  const last = addDays(today, week ? 6 : 0);
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, created_at, status, issue, size_band, preferred_date, preferred_time, name, phone, email, address, city, zip, notes, text_consent, confirmed_date, confirmed_time, block_hours, area, source, arrived_at, left_at",
    )
    .eq("status", "confirmed")
    .gte("confirmed_date", today)
    .lte("confirmed_date", last)
    .order("confirmed_date")
    .order("confirmed_time");
  if (error) return <p className="adm-err">Could not load the schedule. (Ref: today-{error.code ?? "unknown"})</p>;

  const jobs = (data ?? []) as Job[];
  const days = [...new Set(jobs.map((j) => j.confirmed_date!))];

  return (
    <>
      {q.added && <p className="adm-ok">Added to your schedule.</p>}
      <nav className="adm-seg two" aria-label="Range">
        <Link href="/admin/today" aria-current={!week ? "page" : undefined}>Today</Link>
        <Link href="/admin/today?range=week" aria-current={week ? "page" : undefined}>This week</Link>
      </nav>
      {jobs.length === 0 && (
        <p className="adm-empty">{week ? "Nothing booked this week." : "Nothing booked today."}</p>
      )}
      {days.map((d) => (
        <section key={d}>
          {week && <h2 className="adm-sub">{d === today ? "Today" : formatDateLabel(d)}</h2>}
          {jobs.filter((j) => j.confirmed_date === d).map((j) => (
            <JobCard key={j.id} r={j} today={d === today} />
          ))}
        </section>
      ))}
    </>
  );
}

async function TodayDate() {
  await connection();
  return <>{todayLabel()}</>;
}

export default function TodayPage(props: Props) {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <div>
          <div className="adm-date">
            <Suspense fallback={null}>
              <TodayDate />
            </Suspense>
          </div>
          <h1 className="adm-title">Today</h1>
        </div>
        <Link className="adm-link" href="/admin/texts">Quick texts</Link>
      </header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Schedule {...props} />
      </Suspense>
    </main>
  );
}
