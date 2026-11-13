"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { addContractorJob, type ConfirmState } from "../actions";
import { SERVICES } from "@/lib/contractorJob";

type Hit = { name: string; address: string; phone: string | null; kind: "client" | "job" };
type Contractor = { id: string; name: string };

const list: React.CSSProperties = { listStyle: "none", padding: 0, margin: "6px 0 0", display: "flex", flexDirection: "column", gap: 6 };
const item: React.CSSProperties = { width: "100%", justifyContent: "flex-start", textAlign: "left", flexDirection: "column", alignItems: "flex-start", gap: 2, padding: 10 };

export default function AddForm({ contractors, defaultDate, defaultTime = "10:00", initialName = "", initialAddress = "" }: { contractors: Contractor[]; defaultDate: string; defaultTime?: string; initialName?: string; initialAddress?: string }) {
  const [state, action, pending] = useActionState<ConfirmState, FormData>(addContractorJob, { error: null });
  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const [focus, setFocus] = useState<"name" | "addr" | null>(null);
  const [nameHits, setNameHits] = useState<Hit[]>([]);
  const [addrHits, setAddrHits] = useState<Hit[]>([]);
  const [past, setPast] = useState<{ id: string; list: Hit[] }>({ id: "", list: [] });
  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t2 = useRef<ReturnType<typeof setTimeout> | null>(null);

  const typed = name.trim().toLowerCase();
  const chosen = contractors.find((c) => c.name.trim().toLowerCase() === typed) ?? null;
  const pastList = chosen && past.id === chosen.id ? past.list : [];

  const search = (q: string, set: (h: Hit[]) => void, timer: { current: ReturnType<typeof setTimeout> | null }) => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) return;
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/admin/lookup?q=${encodeURIComponent(q.trim())}`, { cache: "no-store" });
        set(r.ok ? ((await r.json()) as { hits: Hit[] }).hits : []);
      } catch { set([]); }
    }, 250);
  };

  // The chosen contractor's earlier properties.
  useEffect(() => {
    if (!chosen) return;
    let live = true;
    fetch(`/admin/lookup?contractor=${chosen.id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { hits: [] }))
      .then((d: { hits: Hit[] }) => { if (live) setPast({ id: chosen.id, list: d.hits }); })
      .catch(() => undefined);
    return () => { live = false; };
  }, [chosen?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onName = (v: string) => { setName(v); setFocus("name"); search(v, setNameHits, t1); };
  const onAddr = (v: string) => { setAddress(v); setFocus("addr"); search(v, setAddrHits, t2); };

  // Contractors first (from your list), then people from the client list.
  const nameMatches = typed.length === 0 ? contractors.slice(0, 6) : contractors.filter((c) => c.name.toLowerCase().includes(typed)).slice(0, 6);
  const nameExtra = typed.length >= 2 ? nameHits.filter((h) => !contractors.some((c) => c.name.trim().toLowerCase() === h.name.trim().toLowerCase())).slice(0, 5) : [];

  const at = address.trim().toLowerCase();
  const pastShown = pastList.filter((h) => !at || h.address.toLowerCase().includes(at)).slice(0, 8);
  const seen = new Set(pastShown.map((h) => h.address.toLowerCase()));
  const addrExtra = at.length >= 3 ? addrHits.filter((h) => h.address && !seen.has(h.address.toLowerCase())).slice(0, 6) : [];
  const addrKnown = !!at && pastList.some((h) => h.address.trim().toLowerCase() === at);

  const noBlur = (e: React.MouseEvent) => e.preventDefault();

  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input type="hidden" name="contractorId" value={chosen?.id ?? ""} />
      <input type="hidden" name="newName" value={chosen ? "" : name.trim()} />

      <div className="adm-field">
        <label htmlFor="contractor">Contractor</label>
        <input id="contractor" type="text" autoComplete="off" value={name} placeholder="Start typing a name" onChange={(e) => onName(e.target.value)} onFocus={() => setFocus("name")} onBlur={() => setFocus(null)} required />
        {focus === "name" && (nameMatches.length > 0 || nameExtra.length > 0) && (
          <ul style={list}>
            {nameMatches.map((c) => (
              <li key={c.id}><button type="button" className="adm-btn" style={item} onMouseDown={noBlur} onClick={() => { setName(c.name); setFocus(null); }}><b>{c.name}</b><span className="adm-muted">Contractor</span></button></li>
            ))}
            {nameExtra.map((h, i) => (
              <li key={`${h.name}|${i}`}><button type="button" className="adm-btn" style={item} onMouseDown={noBlur} onClick={() => { setName(h.name); if (h.address) setAddress(h.address); setFocus(null); }}><b>{h.name}</b><span className="adm-muted">{h.address || "Client list"} · client list</span></button></li>
            ))}
          </ul>
        )}
        {name.trim() && !chosen && <p className="adm-muted">New contractor. They are added to your list when you save.</p>}
      </div>

      <div className="adm-field">
        <label htmlFor="address">Job address</label>
        <input id="address" name="address" type="text" autoComplete="off" value={address} placeholder="Street, city" onChange={(e) => onAddr(e.target.value)} onFocus={() => setFocus("addr")} onBlur={() => setFocus(null)} required />
        {focus === "addr" && (pastShown.length > 0 || addrExtra.length > 0) && (
          <ul style={list}>
            {pastShown.map((h, i) => (
              <li key={`p|${h.address}|${i}`}><button type="button" className="adm-btn" style={item} onMouseDown={noBlur} onClick={() => { setAddress(h.address); setFocus(null); }}><b>{h.address}</b><span className="adm-muted">Earlier job for {chosen?.name}</span></button></li>
            ))}
            {addrExtra.map((h, i) => (
              <li key={`x|${h.address}|${i}`}><button type="button" className="adm-btn" style={item} onMouseDown={noBlur} onClick={() => { setAddress(h.address); setFocus(null); }}><b>{h.address}</b><span className="adm-muted">{h.name} · {h.kind === "client" ? "client list" : "past job"}</span></button></li>
            ))}
          </ul>
        )}
        {address.trim().length > 2 && name.trim() && !addrKnown && <p className="adm-muted">New property. It is saved to {chosen ? `${chosen.name}'s` : "this contractor's"} list when you save.</p>}
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
        <label htmlFor="outcome">When is this job?</label>
        <select id="outcome" name="outcome" defaultValue="">
          <option value="">Still to come (put it on the schedule)</option>
          <option value="done">Already done (close it and bill the time)</option>
          <option value="trip">Already done, not ready or no access (bill the trip fee)</option>
        </select>
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
      <p className="adm-muted">For a job still to come: over 2 hours blocks the whole day, 2 hours leaves 12:30 open, latest start is 1:00 PM. For one already done, enter the date, when you started and the time on site. You then send the bill from the job.</p>
      <div className="adm-panel tint" style={{ gap: 4 }}><b>Billing</b><span className="adm-muted">No deposit. Invoice after the job, due in 7 days.</span></div>
      {state.error && <p className="adm-err" role="alert">{state.error}</p>}
      <button className="adm-btn primary wide" type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save job"}
      </button>
    </form>
  );
}
