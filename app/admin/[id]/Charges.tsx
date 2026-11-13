import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { listCharges } from "@/lib/chargeServer";
import { chargeCents } from "@/lib/charges";
import { formatMoney } from "@/lib/pricing";
import { addCharge, deleteCharge } from "../chargeActions";

// Materials and fees on a job: lab samples, a trip fee, anything else. They add to the balance.
export default async function Charges({ id, locked, open }: { id: string; locked: boolean; open: boolean }) {
  await connection();
  const supabase = await supabaseForUser();
  const charges = await listCharges(supabase, id);
  return (
    <details className="adm-group" id="charges" open={open || charges.length > 0 || undefined}>
      <summary>Materials and charges <span className="v">{charges.length ? `${charges.length} on this job` : "none yet"}</span></summary>
      {charges.map((c) => (
        <div key={c.id} className="adm-note">
          {c.description}{c.qty !== 1 ? ` (${c.qty} x ${formatMoney(c.unit_cents)})` : ""}: <strong>{formatMoney(chargeCents(c))}</strong>
          {!locked && (
            <form action={deleteCharge}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="row" value={c.id} />
              <button className="adm-quiet" type="submit">Remove</button>
            </form>
          )}
        </div>
      ))}
      {!locked && (
        <form action={addCharge} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="hidden" name="id" value={id} />
          <div className="adm-field">
            <label htmlFor="preset">Add</label>
            <select id="preset" name="preset" defaultValue="sample">
              <option value="sample">Lab sample ($85 each)</option>
              <option value="trip">Trip fee ($350)</option>
              <option value="other">Something else</option>
            </select>
          </div>
          <div className="adm-row">
            <div className="adm-field">
              <label htmlFor="qty">How many</label>
              <input id="qty" name="qty" defaultValue="1" inputMode="decimal" />
            </div>
            <div className="adm-field">
              <label htmlFor="price">Price each ($)</label>
              <input id="price" name="price" inputMode="decimal" placeholder="Leave blank for the usual" />
            </div>
          </div>
          <div className="adm-field">
            <label htmlFor="description">Describe it (only for something else)</label>
            <input id="description" name="description" maxLength={120} />
          </div>
          <button className="adm-btn primary wide" type="submit">Add to the balance</button>
        </form>
      )}
    </details>
  );
}
