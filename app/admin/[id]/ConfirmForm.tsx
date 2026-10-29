"use client";
import { useActionState } from "react";
import { offerRequest, type ConfirmState } from "../actions";

export default function ConfirmForm(props: {
  id: string;
  defaultDate: string;
  defaultTime: string;
  label: string;
}) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(offerRequest, {
    error: null,
  });
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <input type="hidden" name="id" value={props.id} />
      <div className="adm-field">
        <label htmlFor="date">Date</label>
        <input id="date" name="date" type="date" defaultValue={props.defaultDate} required />
      </div>
      <div className="adm-row">
        <div className="adm-field">
          <label htmlFor="time">Start time</label>
          <input id="time" name="time" type="time" step={900} defaultValue={props.defaultTime} required />
        </div>
        <div className="adm-field">
          <label htmlFor="hours">Time on site</label>
          <select id="hours" name="hours" defaultValue="2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
              <option key={h} value={h}>
                {h === 1 ? "1 hour" : `${h} hours`}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="adm-muted">Over 2 hours blocks the whole day. 2 hours leaves 12:30 open. Latest start is 1:00 PM.</p>
      {state.error && <p className="adm-err" role="alert">{state.error}</p>}
      <button className="adm-btn primary wide" type="submit" disabled={pending}>
        {pending ? "Sending..." : props.label}
      </button>
    </form>
  );
}
