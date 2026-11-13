"use server";
import { redirect } from "next/navigation";
import { serviceDb } from "@/lib/bookingServer";
import { sendEmail } from "@/lib/notify";
import { sendPush } from "@/lib/push";
import { overlaps } from "@/lib/slots";
import { heldSlots } from "@/lib/availabilityServer";
import { todayInNewYork, formatDateLabel } from "@/lib/dates";
import { formatTime, issueLabel } from "@/lib/labels";
import { PRV_HOURS, parseContractorRequest } from "@/lib/contractorAuth";
import { consumeLogin, currentContractor, endSession, sendLoginLink, siteUrl, startSession } from "@/lib/contractorServer";
import { issueForService } from "@/lib/contractorJob";

const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();

export async function requestLink(form: FormData): Promise<void> {
  const db = serviceDb();
  if (db) await sendLoginLink(db, String(form.get("email") ?? "")).catch(() => undefined);
  redirect("/contractor?sent=1");
}

export async function signIn(form: FormData): Promise<void> {
  const db = serviceDb();
  if (!db) redirect("/contractor?error=1");
  const id = await consumeLogin(db, form.get("t"));
  if (!id || !(await startSession(db, id))) redirect("/contractor?error=link");
  redirect("/contractor");
}

export async function signOut(): Promise<void> {
  const db = serviceDb();
  if (db) await endSession(db);
  redirect("/contractor");
}

// A contractor books a visit. It is held right away, like any booked job, and Cory is told.
export async function scheduleJob(form: FormData): Promise<void> {
  const db = serviceDb();
  const me = db ? await currentContractor(db) : null;
  if (!db || !me) redirect("/contractor");
  const [slotDate = "", slotTime = ""] = String(form.get("slot") ?? "").split("|");
  const parsed = parseContractorRequest({
    service: form.get("service"),
    address: form.get("address"),
    date: slotDate,
    time: slotTime,
    contactName: form.get("contactName") ?? "",
    contactPhone: form.get("contactPhone") ?? "",
    note: form.get("note") ?? "",
    reference: form.get("reference") ?? "",
  });
  if (!parsed.success) redirect(`/contractor?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Check the form")}#schedule`);
  const v = parsed.data;
  const slot = { date: v.date, time: v.time, hours: PRV_HOURS };
  if ((await heldSlots(todayInNewYork())).some((h) => overlaps(h, slot))) redirect("/contractor?error=taken#schedule");

  const notes = [v.contactName && `On-site contact: ${v.contactName}${v.contactPhone ? ` ${v.contactPhone}` : ""}`, v.note].filter(Boolean).join("\n");
  const { data: job, error } = await db
    .from("requests")
    .insert({
      source: "contractor",
      contractor_id: me.id,
      reference: v.reference || null,
      status: "confirmed",
      issue: issueForService(v.service),
      name: me.name,
      address: v.address,
      notes,
      preferred_date: v.date,
      preferred_time: "10:00",
      text_consent: false,
      area: "core",
      confirmed_date: v.date,
      confirmed_time: v.time,
      block_hours: PRV_HOURS,
      confirmed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !job) redirect(`/contractor?error=${error?.code === "23P01" ? "taken" : "save"}#schedule`);

  const when = `${formatDateLabel(v.date)} at ${formatTime(v.time)}`;
  const to = clean(process.env.ALERT_EMAIL);
  if (to) {
    await sendEmail({
      to,
      subject: `${me.name} scheduled a ${issueLabel(issueForService(v.service))}`,
      text: `${when}\n${v.address}\n${notes}\n\nOpen it: ${siteUrl().replace(/\/+$/, "")}/admin/${job.id}`,
    }).catch(() => undefined);
  }
  await sendPush({ title: `${me.name} booked a visit`, body: `${when}, ${v.address}`, url: `/admin/${job.id}` }).catch(() => 0);
  redirect("/contractor?booked=1");
}
