"use client";
import { useState } from "react";
import { monthTitle, monthWeeks, monthsOf } from "@/lib/calendarGrid";

const TIMES = [
  { value: "10:00", short: "10:00", label: "10:00 AM" },
  { value: "12:30", short: "12:30", label: "12:30 PM" },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu"];

export default function SlotCalendar({
  dates,
  date,
  time,
  longVisit,
  onPick,
}: {
  dates: string[];
  date: string;
  time: string;
  longVisit: boolean;
  onPick: (date: string, time: string) => void;
}) {
  const months = monthsOf(dates);
  const startIndex = Math.max(0, date ? months.indexOf(date.slice(0, 7)) : 0);
  const [index, setIndex] = useState(startIndex);
  const month = months[index] ?? months[0];
  const open = new Set(dates);
  if (!month) return null;

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" className="cal-nav" onClick={() => setIndex(index - 1)} disabled={index === 0} aria-label="Previous month">
          &lsaquo;
        </button>
        <h2>{monthTitle(month)}</h2>
        <button type="button" className="cal-nav" onClick={() => setIndex(index + 1)} disabled={index >= months.length - 1} aria-label="Next month">
          &rsaquo;
        </button>
      </div>
      <div className="cal-grid cal-days" aria-hidden="true">
        {DAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      {monthWeeks(month).map((week, w) => (
        <div className="cal-grid" key={w}>
          {week.map((d, i) =>
            d === null ? (
              <div className="cal-cell empty" key={i} />
            ) : open.has(d) ? (
              <div className="cal-cell" key={d}>
                <span className="cal-num">{Number(d.slice(8))}</span>
                {TIMES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className="cal-slot"
                    disabled={longVisit && t.value !== "10:00"}
                    aria-pressed={date === d && time === t.value}
                    aria-label={`${new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${d}T12:00:00Z`))} at ${t.label}`}
                    onClick={() => onPick(d, t.value)}
                  >
                    {t.short}
                  </button>
                ))}
              </div>
            ) : (
              <div className="cal-cell off" key={d}>
                <span className="cal-num">{Number(d.slice(8))}</span>
              </div>
            ),
          )}
        </div>
      ))}
      <p className="help">
        {longVisit
          ? "Larger properties take more time, so we start at 10:00 AM and keep the rest of the day open."
          : "10:00 AM or 12:30 PM, Monday through Thursday. We confirm the day with you."}
      </p>
    </div>
  );
}
