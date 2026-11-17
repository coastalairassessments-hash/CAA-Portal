"use client";
import { useActionState } from "react";
import { addClient, type ClientState } from "../../clientActions";

export default function NewClientForm() {
  const [state, action, pending] = useActionState<ClientState, FormData>(addClient, { error: null });
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="adm-field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" type="text" autoComplete="off" required maxLength={200} />
      </div>
      <div className="adm-field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" autoComplete="off" placeholder="(561) 555-0123" />
      </div>
      <div className="adm-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="off" />
      </div>
      <div className="adm-field">
        <label htmlFor="address">Address</label>
        <input id="address" name="address" type="text" autoComplete="off" placeholder="Street, city" maxLength={200} />
      </div>
      <div className="adm-field">
        <label htmlFor="notes">Notes (private)</label>
        <textarea id="notes" name="notes" rows={3} maxLength={1000} />
      </div>
      {state.error && <p className="adm-err" role="alert">{state.error}</p>}
      <button className="adm-btn primary wide" type="submit" disabled={pending}>{pending ? "Saving..." : "Save client"}</button>
    </form>
  );
}
