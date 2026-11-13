"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { addContractorJob, type ConfirmState } from "../actions";
import { SERVICES } from "@/lib/contractorJob";

export default function AddForm({ contractors, defaultDate, defaultTime = "10:00", initialName = "", initialAddress = "" }: { contractors: { id: string; name: string }[]; defaultDate: string; defaultTime?: string; initialName?: string; initialAddress?: string }) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(addContractorJob, { error: null });
  type Hit = { name: string; address: string; phone: string | null; kind: "client" | "job" };
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [past, setPast] = useState<Hit[]>([]);
  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const [contractorId, setContractorId] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search past clients and properties as you type.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) return;
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/admin/lookup?q=${encodeURIComponent(q.trim())}`, { cache: "no-store" });
        setHits(r.ok ? ((await r.json()) as { hits: Hit[] }).hits : []);
      } catch { setHits([]); }
    }, 250);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q]);

  // Properties already done for the chosen contractor.
  useEffect(() => {
    if (!contractorId) return;
    let live = true;
    fetch(`/admin/lookup?contractor=${contractorId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { hits: [] }))
      .then((d: { hits: Hit[] }) => { if (live) setPast(d.hits); })
      .catch(() => { if (live) setPast([]); });
    return () => { live = false; };
  }, [contractorId]);

  const shown = q.trim().length >= 2 ? hits : [];
  const shownPast = contractorId ? past : [];
  const pick = (h: Hit) => {
    const match = contractors.find((c) => c.name.trim().toLowerCase() === h.name.trim().toLowerCase());
    if (match) { setContractorId(match.id); setName(""); } else { setContractorId(""); setName(h.name); }
    if (h.address) setAddress(h.address);
    setQ(""); setHits([]);
  };
  const row = (h: Hit, i: number) => (
    <li key={`${h.name}|${h.address}|${i}`}>
      <button type="button" className="adm-btn" style={{ width: "100%", justifyContent: "flex-start", textAlign: "left", flexDirection: "column", alignItems: "flex-start", gap: 2, padding: 10 }} onClick={() => pick(h)}>
        <b>{h.name}</b>
        <span className="adm-muted">{h.address || "No address on file"}{h.kind === "client" ? " · client list" : " · past job"}</span>
      </button>
    </li>
  );

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="adm-field">
        <label htmlFor="lookup">Look up a past client or property</label>
        <input id="lookup" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, street or city" autoComplete="off" />
        {shown.length > 0 && <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 6 }}>{shown.map(row)}</ul>}
        {q.trim().length >= 2 && shown.length === 0 && <p className="adm-muted">Nothing found. Type the details below.</p>}
      </div>
      {contractors.length > 0 && (
        <div className="adm-field">
          <label htmlFor="contractorId">Contractor</label>
          <select id="contractorId" name="contractorId" value={contractorId} onChange={(e) => setContractorId(e.target.value)}>
            <option value="">New contractor (type below)</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="adm-field">
        <label htmlFor="newName">{contractors.length > 0 ? "Or new contractor name" : "Contractor name"}</label>
        <input id="newName" name="newName" type="text" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {shownPast.length > 0 && (
        <div className="adm-field">
          <label>Past properties for this contractor</label>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            {shownPast.slice(0, 8).map((h, i) => (
              <li key={`${h.address}|${i}`}><button type="button" className="adm-btn" style={{ width: "100%", justifyContent: "flex-start", textAlign: "left", padding: 10 }} onClick={() => setAddress(h.address)}>{h.address}</button></li>
            ))}
          </ul>
        </div>
      )}
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
        <input id="address" name="address" type="text" autoComplete="off" placeholder="Street, city" value={address} onChange={(e) => setAddress(e.target.value)} required />
      </div>
      <div className="adm-field">
        <label htmlFor="date">Date</label>
        <input id="date" name="date" type="date" defaultValue={defaultDate} required />
      </div>
      <div className="adm-field">
        <label htmlFor="reference">PO or reference number (optional)</label>
        <input id="reference" name="reference" type="text" autoComplete="off" maxLength={80} />
      </div>
      <div className="adm-field">
        <label htmlFor="notes">Job notes (private: contact, gate code, lockbox, access)</label>
        <textarea id="notes" name="notes" rows={4} maxLength={1000} />
      </div>
      <div className="adm-field">
        <label htmlFor="invoiceNote">Invoice note (optional, prints on the invoice)</label>
        <textarea id="invoiceNote" name="invoiceNote" rows={2} maxLength={500} />
      </div>
      <div className="adm-row">
        <div className="adm-field">
          <label htmlFor="time">Start</label>
          <input id="time" name="time" type="time" step={900} defaultValue={defaultTime} required />
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
      <p className="adm-muted">Over 2 hours blocks the whole day. 2 hours leaves 12:30 open. Latest start is 1:00 PM.</p>
      <div className="adm-panel tint" style={{ gap: 4 }}><b>Billing</b><span className="adm-muted">No deposit. Invoice after the job, due in 7 days.</span></div>
      {state.error && <p className="adm-err" role="alert">{state.error}</p>}
      <button className="adm-btn primary wide" type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add to schedule"}
      </button>
    </form>
  );
}
