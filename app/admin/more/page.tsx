import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { connectionExpired, getConnection } from "@/lib/qbStore";
import { qbHealth } from "@/lib/qbSync";
import { stripeConfigured, stripeHealth } from "@/lib/stripePay";
import { logout } from "../actions";
import PushToggle from "./PushToggle";
import DepositCheck from "./DepositCheck";

export const metadata: Metadata = {
  title: "More | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

const QB_NOTE: Record<string, string> = {
  connected: "QuickBooks is connected.",
  denied: "QuickBooks was not connected. You can try again.",
  failed: "QuickBooks connection failed. Try again.",
  missing: "QuickBooks keys are missing in Netlify.",
};

async function Payments() {
  await connection();
  const set = stripeConfigured();
  const ok = set ? await stripeHealth() : false;
  return (
    <section className="adm-group">
      <h2>Deposits</h2>
      {ok ? (
        <p className="adm-ok">Working. Clients pay deposits by card on a Stripe page.</p>
      ) : (
        <p className="adm-err">
          {set
            ? "Stripe is not answering, so clients cannot pay deposits. Tap Test deposit payments to see why."
            : "Stripe is not set up yet, so deposits go through QuickBooks."}
        </p>
      )}
      <DepositCheck />
    </section>
  );
}

async function QuickBooks({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const q = await searchParams;
  const why = typeof q.why === "string" ? q.why.slice(0, 160) : "";
  const note = typeof q.qb === "string" ? QB_NOTE[q.qb] + (why ? ` Reason: ${why}` : "") : undefined;
  let linked = false;
  let expired = false;
  let health: Awaited<ReturnType<typeof qbHealth>> | null = null;
  try {
    const conn = await getConnection();
    linked = !!conn;
    expired = !!conn && connectionExpired(conn);
    if (conn && !expired) health = await qbHealth();
  } catch {
    linked = false;
  }
  return (
    <section className="adm-group">
      <h2>QuickBooks</h2>
      <p className="adm-muted">Only used for final invoices. Clients are never held up by it.</p>
      {note && <p className="adm-ok">{note}</p>}
      {health?.ok ? (
        <p className="adm-ok">Working. Linked to {health.company}.</p>
      ) : (
        <>
          <p className="adm-err">
            {expired || linked
              ? "Not connected right now. Reconnect before sending a final invoice."
              : "Not connected yet. Connect before sending a final invoice."}
          </p>
          <a className="adm-btn wide" href="/api/qb/connect">
            {linked ? "Reconnect QuickBooks" : "Connect QuickBooks"}
          </a>
        </>
      )}
    </section>
  );
}

async function Alerts() {
  await connection();
  const key = process.env.VAPID_PUBLIC_KEY?.trim().replace(/^["']+|["']+$/g, "");
  if (!key) return null;
  return <PushToggle publicKey={key} />;
}

export default function MorePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1 className="adm-title">More</h1>
      </header>
      <Suspense fallback={null}>
        <Alerts />
      </Suspense>
      <Suspense fallback={null}>
        <Payments />
      </Suspense>
      <Suspense fallback={null}>
        <QuickBooks searchParams={searchParams} />
      </Suspense>
      <section className="adm-group adm-menu">
        <Link className="adm-btn wide" href="/admin/texts">Quick texts</Link>
        <Link className="adm-btn wide" href="/admin/contractors">Contractor logins</Link>
        <Link className="adm-btn wide" href="/admin/referrals">Referral partners</Link>
        <Link className="adm-btn wide" href="/admin/clients">Find a client (QuickBooks)</Link>
        <a className="adm-btn wide" href="/request">Public request page</a>
        <a className="adm-btn wide" href="/terms">Terms clients agree to</a>
        <a className="adm-btn wide" href="/policy">Booking policy</a>
      </section>
      <form action={logout}>
        <button className="adm-btn wide" type="submit">Sign out</button>
      </form>
    </main>
  );
}
