import Link from "next/link";
import { mapsLink, type AdminRow } from "@/lib/admin";
import { formatTime, fullAddress, jobLabel } from "@/lib/labels";
import { onMyWayText, runningLateText, smsLink } from "@/lib/confirm";
import { type DashRow, type money, type needsYou } from "@/lib/dashboard";
import { formatMoney } from "@/lib/pricing";
import { progress } from "@/lib/stage";
import { stampTime } from "../actions";

export type Job = AdminRow & DashRow & { en_route_at?: string | null; arrived_at: string | null; left_at: string | null };

function Stamp({ id, which, done, label }: { id: string; which: "en_route_at" | "arrived_at" | "left_at"; done: boolean; label: string }) {
  return (
    <form action={stampTime}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="which" value={which} />
      <input type="hidden" name="back" value="today" />
      {done && <input type="hidden" name="clear" value="1" />}
      <button className={`adm-btn wide${done ? "" : " primary"}`} type="submit" style={{ minHeight: 48 }}>
        {done ? `${label} ✓` : label}
      </button>
    </form>
  );
}

export function JobCard({ r, today, hero = false }: { r: Job; today: boolean; hero?: boolean }) {
  const contractor = r.source === "contractor";
  const canText = !!r.phone && r.text_consent;
  const slot = { name: r.name };
  if (!hero) {
    const [clock, ampm] = formatTime(r.confirmed_time!).split(" ");
    return (
      <Link href={`/admin/${r.id}`} className="adm-later">
        <div className="t"><b>{clock}</b><span>{ampm}</span></div>
        <div className="m">
          <div className="n">{r.name}</div>
          <div className="s">{jobLabel(r)} · {r.block_hours} {r.block_hours === 1 ? "hr" : "hrs"}</div>
        </div>
        <span className={`adm-chip${contractor ? " warn" : ""}`}>{contractor ? "Invoice after" : "Deposit paid"}</span>
      </Link>
    );
  }
  return (
    <div className={hero ? undefined : "adm-jobrow"}>
    {!hero && <div className="t">{formatTime(r.confirmed_time!)}</div>}
    <article className={hero ? "adm-card hero" : "adm-card"}>
      {hero && (
        <div className="adm-herohead">
          <span>Next up</span>
          <b>{formatTime(r.confirmed_time!)}</b>
        </div>
      )}
      {!hero && (
        <div className="adm-chips">
          <span className={`adm-chip${contractor ? "" : " solid"}`}>{contractor ? "Contractor" : "Homeowner"}</span>
          {contractor ? <span className="adm-chip warn">Invoice after</span> : <span className="adm-chip">Deposit paid</span>}
        </div>
      )}
      <h2>{r.name}</h2>
      <p className="adm-line">{jobLabel(r)} · about {r.block_hours} {r.block_hours === 1 ? "hour" : "hours"}</p>
      <p className="adm-muted">{hero ? `${r.address}, ${r.city}` : fullAddress(r)}</p>
      <div className="adm-actions three">
        <a className="adm-btn primary" href={mapsLink(r)}>Navigate</a>
        {r.phone ? <a className="adm-btn" href={`tel:${r.phone}`}>Call</a> : <span className="adm-btn" aria-disabled="true" style={{ opacity: 0.45 }}>Call</span>}
        <Link className="adm-btn" href={`/admin/${r.id}`}>Open</Link>
      </div>
      {today && (
        <div className="adm-row" style={{ marginTop: 8 }}>
          {r.left_at ? (
            <Stamp id={r.id} which="left_at" done label="Left" />
          ) : r.arrived_at ? (
            <Stamp id={r.id} which="left_at" done={false} label="Left" />
          ) : r.en_route_at ? (
            <Stamp id={r.id} which="arrived_at" done={false} label="Arrived" />
          ) : (
            <Stamp id={r.id} which="en_route_at" done={false} label="On my way" />
          )}
        </div>
      )}
      {today && canText && !hero && (
        <div className="adm-row" style={{ marginTop: 8 }}>
          <a className="adm-btn" href={smsLink(r.phone!, onMyWayText(slot))}>Text: on my way</a>
          <a className="adm-btn" href={smsLink(r.phone!, runningLateText(slot))}>Text: running late</a>
        </div>
      )}
    </article>
    </div>
  );
}

export function Tiles({ n }: { n: ReturnType<typeof needsYou> }) {
  const rows = [
    { n: n.approve, label: "New requests to approve", href: "/admin?tab=requests", tone: "dark" },
    { n: n.deposits, label: "Deposits waiting", href: "/admin?tab=requests", tone: "amber" },
    { n: n.toInvoice, label: "Final invoices to send", href: "/admin?tab=owed", tone: "teal" },
    { n: n.refunds, label: "Refunds due", href: "/admin?tab=declined", tone: "amber" },
    { n: n.emails, label: "Client emails that did not send", href: "/admin?tab=all", tone: "amber" },
  ].filter((t) => t.n > 0);
  if (rows.length === 0) return <p className="adm-ok">You&rsquo;re caught up. Nothing needs you.</p>;
  return (
    <section>
      <h2 className="adm-sub">Needs you</h2>
      <div className="adm-needs">
        {rows.map((t) => (
          <Link key={t.label} href={t.href} className="adm-need">
            <span className={`n ${t.tone}`}>{t.n}</span>
            <span className="l">{t.label}</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function MoneyCard({ m }: { m: ReturnType<typeof money> }) {
  return (
    <section className="adm-group">
      <h2>Money</h2>
      <div className="adm-table">
        <span>Deposits waiting</span><span className="amt">{formatMoney(m.depositsWaiting)}</span>
        <span>Owed to you</span><span className="amt">{formatMoney(m.owed.total)}</span>
      </div>
      {m.owed.total > 0 && (
        <p className="adm-muted">
          0 to 7 days {formatMoney(m.owed.d0to7)} · 8 to 14 {formatMoney(m.owed.d8to14)} · 15 or more {formatMoney(m.owed.d15plus)}
        </p>
      )}
      <div className="adm-table">
        <span>Paid this month</span><span className="amt">{formatMoney(m.paidThisMonth)}</span>
      </div>
      <Link className="adm-link" href="/admin?tab=owed">See who owes you</Link>
    </section>
  );
}


// Everyone still in play, what needs you first. Today's visits are already shown above.
export function Motion({ rows, today }: { rows: Job[]; today: string }) {
  const now = new Date();
  const list = rows
    .map((r) => ({ r, p: progress(r, today, now) }))
    .filter(({ r, p }) => p.alive && !(r.status === "confirmed" && r.confirmed_date === today && !r.left_at))
    .sort((a, b) => Number(b.p.warn) - Number(a.p.warn));
  if (list.length === 0) return null;
  const shown = list.slice(0, 6);
  return (
    <section>
      <h2 className="adm-sub">Clients in motion</h2>
      <div className="adm-needs">
        {shown.map(({ r, p }) => (
          <Link key={r.id} href={`/admin/${r.id}`} className="adm-need">
            <span className="l">
              <strong>{r.name}</strong>
              <span className="adm-muted" style={{ display: "block" }}>{p.label}{p.note ? ` · ${p.note}` : ""}</span>
            </span>
            {p.warn && <span className="adm-chip warn">Needs you</span>}
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </Link>
        ))}
      </div>
      {list.length > shown.length && <Link className="adm-link" href="/admin">See all {list.length}</Link>}
    </section>
  );
}
