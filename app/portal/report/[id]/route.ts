// A client's report download: only for their own job, only once unlocked, only from that job's own folder.
import { NextResponse, connection } from "next/server";
import { serviceDb } from "@/lib/bookingServer";
import { canOpenReport } from "@/lib/clientAuth";
import { currentClient } from "@/lib/clientServer";
import { REPORT_BUCKET } from "@/lib/report";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await ctx.params;
  const db = serviceDb();
  const me = db ? await currentClient(db) : null;
  if (!db || !me) return NextResponse.redirect(new URL("/portal?need=report", req.url));
  const home = new URL("/portal", req.url);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(home);
  const { data: r } = await db
    .from("requests")
    .select("id, client_id, report_path, final_paid_at, report_released_at")
    .eq("id", id)
    .eq("client_id", me.id)
    .maybeSingle();
  if (!r || !canOpenReport(me.id, r)) return NextResponse.redirect(home);
  const { data } = await db.storage.from(REPORT_BUCKET).createSignedUrl(r.report_path as string, 600, { download: "Coastal-Air-Assessments-Report.pdf" });
  return NextResponse.redirect(data?.signedUrl ?? home);
}
