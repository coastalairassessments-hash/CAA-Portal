import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { addDays, formatDateLabel, todayInNewYork } from "@/lib/dates";
import { money, needsYou, nextUp } from "@/lib/dashboard";
import { todayLabel } from "@/lib/admin";
import { JobCard, MoneyCard, Tiles, type Job } from "./parts";

export const metadata: Metadata = {
  title: "Today | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const COLUMNS =
  "id, created_at, status, issue, size_band, preferred_date, preferred_time, name, phone, email, address, city, zip, notes, text_consent, confirmed_date, confirmed_time, block_hours, area, source, arrived_at, left_at, deposit_cents, deposit_paid_at, lab_samples, extras_cents, final_paid_at, final_invoice_no, cancel_refund, refunded_at";

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
    .select(COLUMNS)
    .in("status", ["new", "offered", "confirmed", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return <p className="adm-err">Could not load the schedule. (Ref: today-{error.code ?? "unknown"})</p>;

  const all = (data ?? []) as unknown as Job[];
  const jobs = all
    .filter((j) => j.status === "confirmed" && j.confirmed_date! >= today && j.confirmed_date! <= last)
    .sort((x, y) => `${x.confirmed_date} ${x.confirmed_time}`.localeCompare(`${y.confirmed_date} ${y.confirmed_time}`));
  const next = !week ? (nextUp(all) as Job | null) : null;
  const rest = jobs.filter((j) => j.id !== next?.id);
  const days = [...new Set(rest.map((j) => j.confirmed_date!))];

  return (
    <>
      {q.added && <p className="adm-ok">Added to your schedule.</p>}
      {next && <JobCard r={next} today hero />}

      {jobs.length === 0 && (
        <p className="adm-empty">{week ? "Nothing booked this week." : "Nothing booked today."}</p>
      )}
      {days.map((d) => (
        <section key={d}>
          {(week || next) && <h2 className="adm-sub">{week ? (d === today ? "Today" : formatDateLabel(d)) : "Later today"}</h2>}
          {rest.filter((j) => j.confirmed_date === d).map((j) => (
            <JobCard key={j.id} r={j} today={d === today} />
          ))}
        </section>
      ))}

      <Tiles n={needsYou(all)} />

      <MoneyCard m={money(all)} />

    </>
  );
}

async function CountPill() {
  await connection();
  const supabase = await supabaseForUser();
  const { data } = await supabase.from("requests").select("id").eq("status", "confirmed").eq("confirmed_date", todayInNewYork());
  const n = data?.length ?? 0;
  return <span className="adm-countpill">{n} {n === 1 ? "inspection" : "inspections"}</span>;
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
        <Suspense fallback={null}>
          <CountPill />
        </Suspense>
      </header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Schedule {...props} />
      </Suspense>
    </main>
  );
}
