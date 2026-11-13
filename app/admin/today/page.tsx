import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { todayInNewYork } from "@/lib/dates";
import { homeDays } from "@/lib/home";
import type { WeekRow } from "@/lib/week";
import Schedule2 from "./Schedule";
import { money, needsYou, nextUp } from "@/lib/dashboard";
import { todayLabel } from "@/lib/admin";
import { JobCard, MoneyCard, Motion, Tiles, type Job } from "./parts";

export const metadata: Metadata = {
  title: "Home | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const COLUMNS =
  "id, created_at, status, issue, size_band, preferred_date, preferred_time, name, phone, email, address, city, zip, notes, text_consent, confirmed_date, confirmed_time, block_hours, area, source, booking_mode, en_route_at, arrived_at, left_at, deposit_cents, deposit_paid_at, lab_samples, extras_cents, trip_only, final_paid_at, final_invoice_no, cancel_refund, refunded_at, email_failed_at";

async function Schedule({ searchParams }: Props) {
  const q = await searchParams;
  const supabase = await supabaseForUser();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");

  const today = todayInNewYork();
  const { data, error } = await supabase
    .from("requests")
    .select(COLUMNS)
    .in("status", ["new", "offered", "confirmed", "cancelled"])
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return <p className="adm-err">Could not load your schedule. (Ref: home-{error.code ?? "unknown"})</p>;
  const { data: blockData } = await supabase.from("time_blocks").select("day, slot").gte("day", today);

  const all = (data ?? []) as unknown as Job[];
  const days = homeDays(all as unknown as WeekRow[], blockData ?? [], today);
  const next = nextUp(all) as Job | null;
  const d = typeof q.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(q.d) ? q.d : today;
  const v = q.v === "week" ? "week" : "day";

  return (
    <>
      {q.added && <p className="adm-ok">Added to your schedule.</p>}
      {next && <JobCard r={next} today hero />}

      <Schedule2 days={days} today={today} initialDay={d} initialView={v} />

      <Tiles n={needsYou(all)} />

      <Motion rows={all} today={today} />

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
          <h1 className="adm-title">Home</h1>
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
