import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { SITE_URL_FALLBACK } from "@/lib/notify";
import { smsLink } from "@/lib/confirm";
import { REFERRAL_KINDS, kindLabel, referralLink, tally } from "@/lib/referrals";
import { addPartner, deletePartner, setPartnerPhone } from "../referralActions";
import CopyLink from "./CopyLink";

export const metadata: Metadata = {
  title: "Referrals | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

async function Referrals({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const q = await searchParams;
  const site = process.env.SITE_URL?.trim() || SITE_URL_FALLBACK;
  const supabase = await supabaseForUser();
  const [p, j] = await Promise.all([
    supabase.from("referral_partners").select("id, name, kind, code, phone").order("created_at", { ascending: false }).limit(500),
    supabase.from("requests").select("referral_code, final_paid_at").not("referral_code", "is", null).limit(2000),
  ]);
  const partners = p.data ?? [];
  const stats = tally(partners, j.data ?? []);
  const idOf = new Map(partners.map((x) => [x.code, x.id]));
  const phoneOf = new Map(partners.map((x) => [x.code, (x as { phone?: string | null }).phone ?? null]));

  return (
    <>
      {(p.error || j.error) && <p className="adm-err">Referrals are not set up yet. Run the 0021 SQL in Supabase.</p>}
      {q.error && <p className="adm-err">That did not save. Check the name and try again.</p>}
      {q.added && <p className="adm-ok">Added. Copy their link below.</p>}
      {q.saved && <p className="adm-ok">Saved.</p>}

      <section className="adm-group">
        <h2>Add a partner</h2>
        <form action={addPartner} className="adm-field">
          <label htmlFor="pname">Name</label>
          <input id="pname" name="name" required minLength={2} maxLength={80} placeholder="Jane Smith, Coastal Realty" />
          <label htmlFor="pkind">Type</label>
          <select id="pkind" name="kind" defaultValue="realtor">
            {REFERRAL_KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
          <label htmlFor="pphone">Phone (for thank-you texts, optional)</label>
          <input id="pphone" name="phone" type="tel" inputMode="tel" placeholder="772 555 0100" />
          <button className="adm-btn primary wide" type="submit">Add and make a link</button>
        </form>
      </section>

      {stats.length === 0 && !p.error && <p className="adm-empty">No partners yet.</p>}
      {stats.map((s) => {
        const link = referralLink(s.code, site);
        return (
          <section className="adm-group" key={s.code}>
            <div className="adm-card-head">
              <h2>{s.name}</h2>
              <span className="adm-ago">{kindLabel(s.kind)}</span>
            </div>
            <p className="adm-line">{s.jobs} {s.jobs === 1 ? "job" : "jobs"} sent · {s.paid} paid</p>
            <p className="adm-muted" style={{ wordBreak: "break-all" }}>{link}</p>
            <form action={setPartnerPhone} className="adm-field">
              <input type="hidden" name="id" value={idOf.get(s.code) ?? ""} />
              <label htmlFor={`ph-${s.code}`}>Phone</label>
              <input id={`ph-${s.code}`} name="phone" type="tel" inputMode="tel" defaultValue={phoneOf.get(s.code) ?? ""} placeholder="For thank-you texts" />
              <button className="adm-btn" type="submit">Save phone</button>
            </form>
            <div className="adm-actions three">
              <CopyLink text={link} />
              <a className="adm-btn" href={smsLink("", `Here is my booking link for Coastal Air Assessments: ${link}`)}>Text it</a>
              <form action={deletePartner}>
                <input type="hidden" name="id" value={idOf.get(s.code) ?? ""} />
                <button className="adm-btn" type="submit" style={{ width: "100%" }}>Remove</button>
              </form>
            </div>
          </section>
        );
      })}
      <p className="adm-foot">Anyone who books through a partner&apos;s link is tagged automatically. For phone jobs, pick the partner on the job. Clients never see this.</p>
    </>
  );
}

export default function ReferralsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <div>
          <Link className="adm-link" href="/admin/more">‹ More</Link>
          <h1 className="adm-title">Referrals</h1>
        </div>
      </header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Referrals searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
