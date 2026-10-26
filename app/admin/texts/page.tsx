import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { SITE_URL_FALLBACK } from "@/lib/notify";
import { linkText, missedCallText } from "@/lib/quicktexts";
import { smsLink } from "@/lib/confirm";

export const metadata: Metadata = {
  title: "Quick texts | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

async function Texts() {
  await connection();
  const site = process.env.SITE_URL?.trim() || SITE_URL_FALLBACK;
  const items = [
    { title: "Send the link", note: "You're on the phone and they're ready to book.", body: linkText(site) },
    { title: "Missed call", note: "You couldn't pick up.", body: missedCallText(site) },
  ];
  return (
    <>
      {items.map((t) => (
        <section className="adm-group" key={t.title}>
          <h2>{t.title}</h2>
          <p className="adm-muted">{t.note}</p>
          <p className="adm-line">{t.body}</p>
          <a className="adm-btn primary wide" href={smsLink("", t.body)}>Open in Messages</a>
        </section>
      ))}
      <p className="adm-muted">Messages opens with the text written. You pick who it goes to.</p>
    </>
  );
}

export default function TextsPage() {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <div>
          <Link className="adm-link" href="/admin/more">‹ More</Link>
          <h1 className="adm-title">Quick texts</h1>
        </div>
      </header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Texts />
      </Suspense>
    </main>
  );
}
