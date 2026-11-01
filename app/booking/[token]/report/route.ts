// The client's report download. Checks the private booking token and that the report is unlocked,
// then sends them to a 10-minute link. The file itself is never public.
import { NextResponse, connection } from "next/server";
import { bookingByToken, serviceDb } from "@/lib/bookingServer";
import { REPORT_BUCKET, reportState, validReportPath } from "@/lib/report";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await ctx.params;
  const r = await bookingByToken(token);
  const back = new URL(`/booking/${token}`, _req.url);
  if (!r || reportState(r as never) !== "ready") return NextResponse.redirect(back);
  const path = (r as { report_path?: string | null }).report_path;
  const db = serviceDb();
  if (!db || !validReportPath(r.id, path)) return NextResponse.redirect(back);
  const { data } = await db.storage.from(REPORT_BUCKET).createSignedUrl(path as string, 600, { download: "Coastal-Air-Assessments-Report.pdf" });
  return NextResponse.redirect(data?.signedUrl ?? back);
}
