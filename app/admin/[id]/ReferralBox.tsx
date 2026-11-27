import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { smsLink } from "@/lib/confirm";
import { thankReferrerText } from "@/lib/referrals";
import { setJobReferral } from "../referralActions";
import ThankReferrer from "./ThankReferrer";

export default async function ReferralBox({ id, code, paid = false, thanked = false }: { id: string; code: string | null; paid?: boolean; thanked?: boolean }) {
  await connection();
  const supabase = await supabaseForUser();
  const { data } = await supabase.from("referral_partners").select("name, code, phone").order("name").limit(500);
  const partners = data ?? [];
  const current = partners.find((p) => p.code === code);
  return (
    <details className="adm-group">
      <summary>Referred by <span className="v">{current?.name ?? (code ? "Unknown partner" : "No one")}</span></summary>
      <form action={setJobReferral} className="adm-field">
        <input type="hidden" name="id" value={id} />
        <label htmlFor="ref-code">Who sent this job?</label>
        <select id="ref-code" name="code" defaultValue={code ?? ""}>
          <option value="">No one</option>
          {partners.map((p) => (
            <option key={p.code} value={p.code}>{p.name}</option>
          ))}
        </select>
        <button className="adm-btn primary wide" type="submit">Save</button>
      </form>
      {current && paid && !thanked && (
        current.phone ? (
          <ThankReferrer id={id} href={smsLink(current.phone, thankReferrerText(current.name))} />
        ) : (
          <p className="adm-muted">Add {current.name}&rsquo;s phone on the Referrals page to send a thank-you text.</p>
        )
      )}
    </details>
  );
}
