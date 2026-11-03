// The booking link alone no longer opens a report. It checks the private booking token and that the report is unlocked,
// then hands off to the portal, where the client must be signed in as the job's owner.
import { NextResponse, connection } from "next/server";
import { bookingByToken } from "@/lib/bookingServer";
import { reportState } from "@/lib/report";

export async function GET(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await ctx.params;
  const r = await bookingByToken(token);
  const back = new URL(`/booking/${token}`, _req.url);
  if (!r || reportState(r as never) !== "ready") return NextResponse.redirect(back);
  return NextResponse.redirect(new URL(`/portal/report/${r.id}`, _req.url));
}
