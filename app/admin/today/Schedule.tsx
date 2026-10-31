"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatDateLabel } from "@/lib/dates";
import { formatTime } from "@/lib/labels";
import { homeBack, weekOf } from "@/lib/home";
import type { Cell, Day } from "@/lib/week";
import { closeSlot, openSlot } from "../actions";

const STATE_LABEL = { open: "Open", pending: "Asked for", booked: "Booked", blocked: "Day held", closed: "Closed" } as const;
type View = "day" | "week";
type Pick = { date: string; time: string | null; closedDay: boolean };

export default function Schedule({ days, today, initialDay, initialView }: { days: Day[]; today: string; initialDay: string; initialView: View }) {
  const first = Math.max(0, days.findIndex((d) => d.date === initialDay));
  const [view, setView] = useState<View>(initialView);
  const [index, setIndex] = useState(first);
  const [pick, setPick] = useState<Pick | null>(null);
  const touch = useRef<number | null>(null);

  const day = days[index] ?? days[0];
  if (!day) return null;
  const week = weekOf(days, day.date);
  const weekFirst = days.indexOf(week[0]);
  const weekLast = days.indexOf(week[week.length - 1]);

  const move = (dir: 1 | -1) => {
    if (view === "day") setIndex((i) => Math.min(days.length - 1, Math.max(0, i + dir)));
    else setIndex(dir === 1 ? Math.min(days.length - 1, weekLast + 1) : Math.max(0, weekFirst - 1));
  };
  const canBack = view === "day" ? index > 0 : weekFirst > 0;
  const canNext = view === "day" ? index < days.length - 1 : weekLast < days.length - 1;

  const heading =
    view === "day"
      ? day.date === today ? `Today, ${formatDateLabel(day.date)}` : formatDateLabel(day.date)
      : `${formatDateLabel(week[0].date)}${week.length > 1 ? ` to ${formatDateLabel(week[week.length - 1].date)}` : ""}`;

  return (
    <section
      className="sch"
      onTouchStart={(e) => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 70) { if (dx < 0 && canNext) move(1); if (dx > 0 && canBack) move(-1); }
      }}
    >
      <div className="sch-top">
        <div className="sch-seg" role="tablist" aria-label="Schedule view">
          <button type="button" role="tab" aria-selected={view === "day"} onClick={() => setView("day")}>Day</button>
          <button type="button" role="tab" aria-selected={view === "week"} onClick={() => setView("week")}>Week</button>
        </div>
      </div>
      <div className="sch-pager">
        <button type="button" onClick={() => move(-1)} disabled={!canBack} aria-label={view === "day" ? "Previous day" : "Previous week"}>&lsaquo;</button>
        <h2>{heading}</h2>
        <button type="button" onClick={() => move(1)} disabled={!canNext} aria-label={view === "day" ? "Next day" : "Next week"}>&rsaquo;</button>
      </div>

      {view === "day" ? (
        <DayBlock day={day} view={view} today={today} onPick={setPick} big />
      ) : (
        week.map((d) => <DayBlock key={d.date} day={d} view={view} today={today} onPick={setPick} />)
      )}

      {pick && <Sheet pick={pick} view={view} onClose={() => setPick(null)} />}
    </section>
  );
}

function DayBlock({ day, view, today, onPick, big = false }: { day: Day; view: View; today: string; onPick: (p: Pick) => void; big?: boolean }) {
  const back = homeBack(day.date, view);
  return (
    <div className={`wk-day${big ? " big" : ""}`}>
      {!big && (
        <div className="wk-head">
          <h3 className="adm-sub">{day.date === today ? "Today" : formatDateLabel(day.date)}</h3>
          {day.dayClosed ? (
            <form action={openSlot}>
              <input type="hidden" name="day" value={day.date} /><input type="hidden" name="slot" value="all" /><input type="hidden" name="back" value={back} />
              <button className="adm-link" type="submit">Reopen day</button>
            </form>
          ) : (
            <button className="adm-link" type="button" onClick={() => onPick({ date: day.date, time: null, closedDay: false })}>Block day</button>
          )}
        </div>
      )}
      <div className="wk-row">
        {day.cells.map((c) => (
          <CellCard key={c.time} c={c} day={day} back={back} onPick={onPick} />
        ))}
      </div>
      {big && (
        <form action={day.dayClosed ? openSlot : closeSlot} className="sch-dayaction">
          <input type="hidden" name="day" value={day.date} /><input type="hidden" name="slot" value="all" /><input type="hidden" name="back" value={back} />
          <button className="adm-btn wide" type="submit">{day.dayClosed ? "Reopen this day" : "Block this whole day"}</button>
        </form>
      )}
    </div>
  );
}

function CellCard({ c, day, back, onPick }: { c: Cell; day: Day; back: string; onPick: (p: Pick) => void }) {
  const r = c.rows[0];
  const inner = (
    <>
      <span className="wk-time">{formatTime(c.time)}</span>
      <span className="wk-state">{STATE_LABEL[c.state]}</span>
      {r && <span className="wk-who">{r.name}{c.rows.length > 1 ? ` +${c.rows.length - 1}` : ""}</span>}
      {c.state === "open" && <span className="wk-tap">Tap to add or block</span>}
      {c.state === "closed" && !day.dayClosed && <span className="wk-tap">Tap to reopen</span>}
    </>
  );
  if (r) return <Link href={`/admin/${r.id}`} className={`wk-cell ${c.state}`}>{inner}</Link>;
  if (c.state === "closed" && !day.dayClosed) {
    return (
      <form action={openSlot} className="wk-wrap">
        <input type="hidden" name="day" value={day.date} /><input type="hidden" name="slot" value={c.time} /><input type="hidden" name="back" value={back} />
        <button type="submit" className={`wk-cell ${c.state} wk-btn`}>{inner}</button>
      </form>
    );
  }
  if (c.state === "open") {
    return (
      <button type="button" className={`wk-cell ${c.state} wk-btn`} onClick={() => onPick({ date: day.date, time: c.time, closedDay: false })}>
        {inner}
      </button>
    );
  }
  return <div className={`wk-cell ${c.state}`}>{inner}</div>;
}

function Sheet({ pick, view, onClose }: { pick: Pick; view: View; onClose: () => void }) {
  const back = homeBack(pick.date, view);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const title = `${formatDateLabel(pick.date)}${pick.time ? `, ${formatTime(pick.time)}` : ""}`;
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {pick.time && (
          <Link className="adm-btn primary wide" href={`/admin/add?date=${pick.date}&time=${pick.time}`}>Add a job here</Link>
        )}
        {pick.time && (
          <form action={closeSlot}>
            <input type="hidden" name="day" value={pick.date} /><input type="hidden" name="slot" value={pick.time} /><input type="hidden" name="back" value={back} />
            <button className="adm-btn wide" type="submit">Block this time</button>
          </form>
        )}
        <form action={closeSlot}>
          <input type="hidden" name="day" value={pick.date} /><input type="hidden" name="slot" value="all" /><input type="hidden" name="back" value={back} />
          <button className="adm-btn wide" type="submit">Block the whole day</button>
        </form>
        <button className="adm-quiet" type="button" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
