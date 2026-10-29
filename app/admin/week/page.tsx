import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { addDays, formatDateLabel, todayInNewYork } from "@/lib/dates";
import { buildWeek, mondayOf, type WeekRow } from "@/lib/week";
import { formatTime, issueLabel } from "@/lib/labels";
import { closeSlot, openSlot } from "../actions";

export const metadata: Metadata = {
  title: "Week | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const STATE_LABEL = { open: "Open", pending: "Asked for", booked: "Booked", blocked: "Day held", closed: "Closed" } as const;

async function WeekGrid({ searchParams }: Props) {
  const q = await searchParams;
  const w = Math.min(12, Math.max(0, Number(q.w) || 0));
  const supabase = await supabaseForUser();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");

  const today = todayInNewYork();
  const monday = addDays(mondayOf(today), w * 7);
  const end = addDays(monday, 6);
  const { data, error } = await supabase
    .from("requests")
    .select("id, status, name, issue, confirmed_date, confirmed_time, preferred_date, preferred_time, block_hours")
    .in("status", ["new", "offered", "confirmed"])
    .or(`confirmed_date.gte.${monday},preferred_date.gte.${monday}`)
    .limit(500);
  if (error) return <p className="adm-err">Could not load the week. (Ref: week-{error.code ?? "unknown"})</p>;

  const { data: blockData } = await supabase.from("time_blocks").select("day, slot").gte("day", monday).lte("day", end);
  const days = buildWeek((data ?? []) as WeekRow[], monday, blockData ?? []).filter((d) => d.date <= end);
  const counts = days.flatMap((d) => d.cells).reduce(
    (a, c) => ({ ...a, [c.state]: a[c.state] + 1 }),
    { open: 0, pending: 0, booked: 0, blocked: 0, closed: 0 },
  );

  return (
    <>
      <nav className="adm-seg" aria-label="Week">
        {w > 0 ? <Link href={`/admin/week?w=${w - 1}`}>Earlier</Link> : <span />}
        <Link href="/admin/week" aria-current={w === 0 ? "page" : undefined}>This week</Link>
        <Link href={`/admin/week?w=${w + 1}`}>Later</Link>
      </nav>
      <p className="adm-muted">
        {formatDateLabel(monday)} to {formatDateLabel(addDays(monday, 3))} · {counts.booked} booked · {counts.pending} asked for · {counts.open} open · {counts.closed} closed
      </p>
      {days.map((d) => (
        <section key={d.date} className={d.date < today ? "wk-past" : undefined}>
          <div className="wk-head">
            <h2 className="adm-sub">{d.date === today ? "Today" : formatDateLabel(d.date)}</h2>
            <form action={d.dayClosed ? openSlot : closeSlot}>
              <input type="hidden" name="day" value={d.date} />
              <input type="hidden" name="slot" value="all" />
              <input type="hidden" name="w" value={w} />
              <button className="adm-link" type="submit">{d.dayClosed ? "Reopen day" : "Close day"}</button>
            </form>
          </div>
          <div className="wk-row">
            {d.cells.map((c) => {
              const r = c.rows[0];
              const inner = (
                <>
                  <span className="wk-time">{formatTime(c.time)}</span>
                  <span className="wk-state">{STATE_LABEL[c.state]}</span>
                  {r && <span className="wk-who">{r.name}{c.rows.length > 1 ? ` +${c.rows.length - 1}` : ""}</span>}
                  {r && <span className="wk-what">{issueLabel(r.issue)}</span>}
                </>
              );
              const toggle = (c.state === "open" || c.state === "pending" || (c.state === "closed" && !d.dayClosed)) && (
                <form action={c.state === "closed" ? openSlot : closeSlot}>
                  <input type="hidden" name="day" value={d.date} />
                  <input type="hidden" name="slot" value={c.time} />
                  <input type="hidden" name="w" value={w} />
                  <button className="adm-link" type="submit">{c.state === "closed" ? "Reopen" : "Close"}</button>
                </form>
              );
              return r ? (
                <div key={c.time} className="wk-wrap">
                  <Link href={`/admin/${r.id}`} className={`wk-cell ${c.state}`}>{inner}</Link>
                  {toggle}
                </div>
              ) : (
                <div key={c.time} className="wk-wrap">
                  <div className={`wk-cell ${c.state}`}>{inner}</div>
                  {toggle}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

async function Title() {
  await connection();
  return null;
}

export default function WeekPage(props: Props) {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <div>
          <h1 className="adm-title">Week</h1>
        </div>
        <Suspense fallback={null}><Title /></Suspense>
      </header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <WeekGrid {...props} />
      </Suspense>
    </main>
  );
}
