// SERVER ONLY. Writes one ledger row per cleared card payment. Best effort: if the table is not there
// yet or the write fails, the payment itself is already recorded elsewhere, so nothing is held up.
import type { SupabaseClient } from "@supabase/supabase-js";

export type LedgerEntry = {
  stripeId: string;
  kind: "deposit" | "balance" | "link";
  cents: number;
  name: string;
  requestId?: string | null;
  linkId?: string | null;
};

export async function recordPayment(db: SupabaseClient, e: LedgerEntry): Promise<void> {
  try {
    await db.from("payments").upsert(
      {
        stripe_id: e.stripeId,
        kind: e.kind,
        amount_cents: Math.max(0, Math.round(e.cents)),
        name: e.name.slice(0, 200),
        request_id: e.requestId ?? null,
        link_id: e.linkId ?? null,
      },
      { onConflict: "stripe_id", ignoreDuplicates: true },
    );
  } catch (err) {
    console.error("[ledger] not recorded:", err instanceof Error ? err.message : err);
  }
}
