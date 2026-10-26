"use client";
import { useActionState } from "react";
import { addContractorJob, type ConfirmState } from "../actions";
import { SERVICES } from "@/lib/contractorJob";

export default function AddForm({ contractors, defaultDate }: { contractors: { id: string; name: string }[]; defaultDate: string }) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(addContractorJob, { error: null });
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {contractors.length > 0 && (
        <div className="adm-field">
          <label htmlFor="contractorId">Contractor</label>
          <select id="contractorId" name="contractorId" defaultValue="">
            <option value="">New contractor (type below)</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="adm-field">
        <label htmlFor="newName">{contractors.length > 0 ? "Or new contractor name" : "Contractor name"}</label>
        <input id="newName" name="newName" type="text" autoComplete="off" />
      </div>
      <div className="adm-field">
        <label htmlFor="service">Service</label>
        <select id="service" name="service" defaultValue="prv">
          {SERVICES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <div className="adm-field">
        <label htmlFor="address">Job address</label>
        <input id="address" name="address" type="text" autoComplete="off" placeholder="Street, city" required />
      </div>
      <div className="adm-field">
        <label htmlFor="date">Date</label>
        <input id="date" name="date" type="date" defaultValue={defaultDate} required />
      </div>
      <div className="adm-row">
        <div className="adm-field">
          <label htmlFor="time">Start</label>
          <input id="time" name="time" type="time" step={900} defaultValue="10:00" required />
        </div>
        <div className="adm-field">
          <label htmlFor="hours">Time on site</label>
          <select id="hours" name="hours" defaultValue="2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
              <option key={h} value={h}>{h === 1 ? "1 hour" : `${h} hours`}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="adm-panel tint" style={{ gap: 4 }}><b>Billing</b><span className="adm-muted">No deposit. Invoice after the job, due in 7 days.</span></div>
      {state.error && <p className="adm-err" role="alert">{state.error}</p>}
      <button className="adm-btn primary wide" type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add to schedule"}
      </button>
    </form>
  );
}
