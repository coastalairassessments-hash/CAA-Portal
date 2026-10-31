import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getConnection } from "@/lib/qbStore";
import { logout } from "../actions";
import PushToggle from "./PushToggle";

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

async function QuickBooks({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const q = await searchParams;
  const note = typeof q.qb === "string" ? QB_NOTE[q.qb] : undefined;
  let linked = false;
  try {
    linked = !!(await getConnection());
  } catch {
    linked = false;
  }
  return (
    <section className="adm-group">
      <h2>QuickBooks</h2>
      {note && <p className="adm-ok">{note}</p>}
      <p className="adm-muted">{linked ? "Connected." : "Not connected yet."}</p>
      <a className={`adm-btn wide${linked ? "" : " primary"}`} href="/api/qb/connect">
        {linked ? "Reconnect QuickBooks" : "Connect QuickBooks"}
      </a>
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
        <QuickBooks searchParams={searchParams} />
      </Suspense>
      <section className="adm-group adm-menu">
        <Link className="adm-btn wide" href="/admin/texts">Quick texts</Link>
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
