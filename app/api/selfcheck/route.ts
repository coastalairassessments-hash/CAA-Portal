// Called twice a day by a Netlify scheduled function. Tests the whole booking path and tells Cory's
// phone only when something is wrong.
import { NextResponse, connection } from "next/server";
import { heldSlots } from "@/lib/availabilityServer";
import { testDepositInvoice } from "@/lib/depositTest";
import { todayInNewYork } from "@/lib/dates";
import { sendPush } from "@/lib/push";
import { sendEmail } from "@/lib/notify";
import { failureMessage, runSelfCheck } from "@/lib/selfCheck";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();

export async function GET(req: Request) {
  await connection();
  const secret = clean(process.env.IP_HASH_SALT);
  if (!secret || req.headers.get("x-cron-key") !== secret) return NextResponse.json({ ok: false }, { status: 401 });
  const origin = new URL(req.url).origin;

  const checks = await runSelfCheck({
    fetchPage: async (path) => {
      const res = await fetch(`${origin}${path}`, { cache: "no-store" });
      return { status: res.status, text: await res.text() };
    },
    loadSlots: () => heldSlots(todayInNewYork()),
    depositInvoice: testDepositInvoice,
    emailConfigured: () => !!process.env.RESEND_API_KEY?.trim() && !!(process.env.CLIENT_FROM ?? process.env.ALERT_FROM)?.trim(),
  });

  const problem = failureMessage(checks);
  if (problem) {
    const phones = await sendPush({ title: "Booking check failed", body: problem, url: "/admin/more" }).catch(() => 0);
    const to = process.env.ALERT_EMAIL?.trim();
    if (!phones && to) await sendEmail({ to, subject: "Booking check failed", text: problem }).catch(() => undefined);
  }
  return NextResponse.json({ ok: !problem, checks });
}
