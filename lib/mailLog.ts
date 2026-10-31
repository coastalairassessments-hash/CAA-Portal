// SERVER ONLY. Sends one client email and remembers on the job if it did not go out.
// Never throws. A failure shows up as a red notice on the job until Cory clears it.
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail, type SendResult } from "./notify";

type Msg = Parameters<typeof sendEmail>[0];

export async function sendLogged(db: Pick<SupabaseClient, "from">, id: string, msg: Msg): Promise<SendResult> {
  const res = await sendEmail(msg);
  if (!res.ok) {
    try {
      await db.from("requests").update({ email_failed_at: new Date().toISOString(), email_failed_reason: res.reason }).eq("id", id);
    } catch {
      /* the log is best effort */
    }
  }
  return res;
}
