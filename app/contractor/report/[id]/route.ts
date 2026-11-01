// A contractor's report download: only for their own jobs, and only once unlocked.
import { NextResponse, connection } from "next/server";
import { serviceDb } from "@/lib/bookingServer";
import { currentContractor } from "@/lib/contractorServer";
import { REPORT_BUCKET, reportState, validReportPath } from "@/lib/report";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await ctx.params;
  const home = new URL("/contractor", req.url);
  const db = serviceDb();
  const me = db ? await currentContractor(db) : null;
  if (!db || !me || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.redirect(home);
  const { data: r } = await db
    .from("requests")
    .select("id, report_path, final_paid_at, report_released_at")
    .eq("id", id)
    .eq("contractor_id", me.id)
    .maybeSingle();
  if (!r || reportState(r) !== "ready" || !validReportPath(r.id, r.report_path)) return NextResponse.redirect(home);
  const { data } = await db.storage.from(REPORT_BUCKET).createSignedUrl(r.report_path as string, 600, { download: "Coastal-Air-Assessments-Report.pdf" });
  return NextResponse.redirect(data?.signedUrl ?? home);
}
