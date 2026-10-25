"use client";
import { useActionState } from "react";
import { confirmRequest, type ConfirmState } from "../actions";

export default function ConfirmForm(props: {
  id: string;
  defaultDate: string;
  defaultTime: string;
  label: string;
}) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(confirmRequest, {
    error: null,
  });
  return (
    <form action={action}>
      <input type="hidden" name="id" value={props.id} />
      <div className="fields">
        <div className="field">
          <label htmlFor="date">Date</label>
          <input id="date" name="date" type="date" defaultValue={props.defaultDate} required />
        </div>
        <div className="field">
          <label htmlFor="time">Start time</label>
          <input id="time" name="time" type="time" step={900} defaultValue={props.defaultTime} required />
        </div>
        <div className="field">
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
      {state.error && <p className="error" role="alert">{state.error}</p>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Confirming..." : props.label}
      </button>
    </form>
  );
}
