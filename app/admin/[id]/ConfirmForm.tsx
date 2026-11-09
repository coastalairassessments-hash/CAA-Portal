"use client";
import { useActionState, useState } from "react";
import { offerRequest, type ConfirmState } from "../actions";
import { conflictText, driveConflict, nearestOkDays, type DriveZone, type Zoned } from "@/lib/driveTime";
import { formatDateLabel } from "@/lib/dates";
import { overlaps } from "@/lib/slots";

export default function ConfirmForm(props: {
  id: string;
  defaultDate: string;
  defaultTime: string;
  label: string;
  zone?: DriveZone | null;
  booked?: Zoned[];
}) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(offerRequest, {
    error: null,
  });
  const [date, setDate] = useState(props.defaultDate);
  const [time, setTime] = useState(props.defaultTime.slice(0, 5));
  const [hours, setHours] = useState("2");

  // A long drive between two visits the same day. Advice only: Cory can still send it.
  const want: Zoned = { date, time, hours: Number(hours), zone: props.zone ?? null };
  const clash = props.zone && date && /^\d\d:\d\d$/.test(time) ? driveConflict(props.booked ?? [], want) : null;
  const days = clash ? nearestOkDays(props.booked ?? [], want, overlaps) : [];

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input type="hidden" name="id" value={props.id} />
      <div className="adm-field">
        <label htmlFor="date">Date</label>
        <input id="date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>
      <div className="adm-row">
        <div className="adm-field">
          <label htmlFor="time">Start time</label>
          <input id="time" name="time" type="time" step={900} value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
        <div className="adm-field">
          <label htmlFor="hours">Time on site</label>
          <select id="hours" name="hours" value={hours} onChange={(e) => setHours(e.target.value)}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
              <option key={h} value={h}>
                {h === 1 ? "1 hour" : `${h} hours`}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="adm-muted">Over 2 hours blocks the whole day. 2 hours leaves 12:30 open. Latest start is 1:00 PM.</p>
      {clash && (
        <p className="adm-err" role="status">
          Long drive. {conflictText(clash)}
          {days.length > 0 && <> Closest days that fit: {days.map((d) => formatDateLabel(d)).join(", ")}.</>}
        </p>
      )}
      {state.error && <p className="adm-err" role="alert">{state.error}</p>}
      <button className="adm-btn primary wide" type="submit" disabled={pending}>
        {pending ? "Sending..." : props.label}
      </button>
    </form>
  );
}
