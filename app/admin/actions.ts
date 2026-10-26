"use server";
import { redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await supabaseForUser();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email or password didn't work." };
  redirect("/admin");
}

export async function logout() {
  const supabase = await supabaseForUser();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---- Offer, deposit, decline ----
import { cancelEmail, confirmEmail, declineEmail, offerEmail, parseConfirm, takenEmail } from "@/lib/confirm";
import { refundDue } from "@/lib/cancel";
import { GOOGLE_REVIEW_URL, reviewEmail } from "@/lib/quicktexts";
import { SITE_URL_FALLBACK, sendEmail } from "@/lib/notify";
import { depositCents } from "@/lib/pricing";
import { overlaps } from "@/lib/slots";
import { isSection, parseSection } from "@/lib/job";
import { issueForService, parseContractorJob } from "@/lib/contractorJob";

export type ConfirmState = { error: string | null };

async function adminClient() {
  const supabase = await supabaseForUser();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: ok } = await supabase.rpc("is_admin");
  return ok ? supabase : null;
}

const siteUrl = () => process.env.SITE_URL?.trim() || SITE_URL_FALLBACK;
const CLIENT_COLUMNS = "name, phone, email, address, city, zip";
const EXCLUSION_VIOLATION = "23P01";

// Approve a request and send the offer. The date is not held until the deposit is received.
// If the job is already booked (deposit paid), this changes the booking instead.
export async function offerRequest(_prev: ConfirmState, form: FormData): Promise<ConfirmState> {
  const supabase = await adminClient();
  if (!supabase) return { error: "This account is not on the admin list." };

  const parsed = parseConfirm({
    id: form.get("id"),
    date: form.get("date"),
    time: form.get("time"),
    hours: form.get("hours"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { id, date, time, hours } = parsed.data;

  const { data: row, error: readErr } = await supabase
    .from("requests").select(`${CLIENT_COLUMNS}, issue, status`).eq("id", id).single();
  if (readErr || !row) return { error: "Could not find that request." };
  if (!["new", "offered", "confirmed"].includes(row.status)) {
    return { error: "This request is closed. Nothing to send." };
  }

  const alreadyBooked = row.status === "confirmed";
  const deposit = depositCents(row.issue);
  const now = new Date().toISOString();
  const { error: saveErr } = await supabase
    .from("requests")
    .update(
      alreadyBooked
        ? { confirmed_date: date, confirmed_time: time, block_hours: hours }
        : {
            status: "offered",
            confirmed_date: date,
            confirmed_time: time,
            block_hours: hours,
            offered_at: now,
            deposit_cents: deposit,
          },
    )
    .eq("id", id);
  if (saveErr) {
    if (saveErr.code === EXCLUSION_VIOLATION) {
      return { error: "Another paid job already holds that time. Pick a different time." };
    }
    return { error: `Could not save. (Ref: offer-${saveErr.code ?? "unknown"})` };
  }

  const booking = { date, time, hours };
  const mail = alreadyBooked
    ? confirmEmail(row, booking, siteUrl())
    : offerEmail(row, booking, deposit, siteUrl());
  const sent = await sendEmail({ to: row.email, ...mail });
  if (!sent.ok) console.error(`[offer] client email not sent: ${sent.reason}`);
  redirect(`/admin/${id}?email=${sent.ok ? "sent" : "failed"}`);
}

// The deposit arrived. The date is now held. First one marked paid wins; the database enforces it.
export async function markDepositReceived(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin");

  const { data: row } = await supabase
    .from("requests")
    .select(`${CLIENT_COLUMNS}, status, confirmed_date, confirmed_time, block_hours`)
    .eq("id", id).single();
  if (!row || row.status !== "offered" || !row.confirmed_date || !row.confirmed_time || !row.block_hours) {
    redirect(`/admin/${id}?error=save`);
  }
  const slot = { date: row.confirmed_date as string, time: row.confirmed_time as string, hours: row.block_hours as number };

  const { error } = await supabase
    .from("requests")
    .update({ status: "confirmed", deposit_paid_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "offered");
  if (error) redirect(`/admin/${id}?error=${error.code === EXCLUSION_VIOLATION ? "taken" : "save"}`);

  // Anyone else offered an overlapping time lost it. Tell them and put them back in New.
  const { data: others } = await supabase
    .from("requests")
    .select(`id, ${CLIENT_COLUMNS}, confirmed_time, block_hours`)
    .eq("status", "offered")
    .eq("confirmed_date", slot.date)
    .neq("id", id);
  for (const o of others ?? []) {
    const theirs = { date: slot.date, time: o.confirmed_time as string, hours: o.block_hours as number };
    if (!overlaps(slot, theirs)) continue;
    const { error: resetErr } = await supabase
      .from("requests")
      .update({ status: "new", confirmed_date: null, confirmed_time: null, block_hours: null, offered_at: null, deposit_cents: null })
      .eq("id", o.id);
    if (resetErr) continue;
    const lost = await sendEmail({ to: o.email, ...takenEmail(o, theirs) });
    if (!lost.ok) console.error(`[taken] client email not sent: ${lost.reason}`);
  }

  const sent = await sendEmail({ to: row.email, ...confirmEmail(row, slot, siteUrl()) });
  if (!sent.ok) console.error(`[deposit] client email not sent: ${sent.reason}`);
  redirect(`/admin/${id}?email=${sent.ok ? "sent" : "failed"}`);
}

export async function declineRequest(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin");

  const { data: client } = await supabase
    .from("requests").select(CLIENT_COLUMNS).eq("id", id).single();
  if (!client) redirect("/admin");

  const { error } = await supabase.from("requests").update({ status: "declined" }).eq("id", id);
  if (error) redirect(`/admin/${id}?error=save`);

  const sent = await sendEmail({ to: client.email, ...declineEmail(client) });
  if (!sent.ok) console.error(`[decline] client email not sent: ${sent.reason}`);
  redirect(`/admin/${id}?email=${sent.ok ? "sent" : "failed"}`);
}

// ---- Job drawers: client extras, lab, money ----
export async function saveSection(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  const section = form.get("section");
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id) || !isSection(section)) redirect("/admin");

  const input: Record<string, FormDataEntryValue | null> = {};
  for (const [k, v] of form.entries()) if (k !== "id" && k !== "section") input[k] = v;
  const parsed = parseSection(section, input);
  if (!parsed.success) redirect(`/admin/${id}?error=check`);

  const { error } = await supabase.from("requests").update(parsed.data).eq("id", id);
  if (error) redirect(`/admin/${id}?error=save`);
  redirect(`/admin/${id}?saved=${section}`);
}

// Arrived / Left buttons. Stamps the current time; "clear" undoes a mistap.
export async function stampTime(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  const which = form.get("which");
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id) || (which !== "arrived_at" && which !== "left_at")) redirect("/admin");
  const value = form.get("clear") ? null : new Date().toISOString();
  const { error } = await supabase.from("requests").update({ [which]: value }).eq("id", id);
  if (form.get("back") === "today") redirect("/admin/today");
  redirect(`/admin/${id}${error ? "?error=save" : ""}`);
}

// The final invoice was paid. This is what later releases the report.
export async function markFinalPaid(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin");
  const clearing = !!form.get("clear");

  const { data: row } = await supabase
    .from("requests").select("name, email, source, final_paid_at").eq("id", id).single();
  const { error } = await supabase
    .from("requests")
    .update({ final_paid_at: clearing ? null : new Date().toISOString() })
    .eq("id", id);
  if (error) redirect(`/admin/${id}?error=save`);

  // First time paid, and a review link is set: thank the client and ask for a review.
  if (!clearing && row && !row.final_paid_at && row.source === "client" && row.email && GOOGLE_REVIEW_URL) {
    const sent = await sendEmail({ to: row.email, ...reviewEmail(row, GOOGLE_REVIEW_URL) });
    if (!sent.ok) console.error(`[review] email not sent: ${sent.reason}`);
    redirect(`/admin/${id}?email=${sent.ok ? "sent" : "failed"}`);
  }
  redirect(`/admin/${id}`);
}

// ---- Contractor jobs ----
export async function addContractorJob(_prev: ConfirmState, form: FormData): Promise<ConfirmState> {
  const supabase = await adminClient();
  if (!supabase) return { error: "This account is not on the admin list." };

  const parsed = parseContractorJob({
    contractorId: form.get("contractorId") ?? "",
    newName: form.get("newName") ?? "",
    service: form.get("service"),
    address: form.get("address"),
    date: form.get("date"),
    time: form.get("time"),
    hours: form.get("hours"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const v = parsed.data;

  // Find or create the contractor.
  let contractorId = v.contractorId;
  let contractorName = "";
  if (contractorId) {
    const { data } = await supabase.from("contractors").select("name").eq("id", contractorId).single();
    if (!data) return { error: "Could not find that contractor." };
    contractorName = data.name;
  } else {
    const name = v.newName;
    const { data: found } = await supabase.from("contractors").select("id, name").ilike("name", name).maybeSingle();
    if (found) {
      contractorId = found.id;
      contractorName = found.name;
    } else {
      const { data: made, error: makeErr } = await supabase.from("contractors").insert({ name }).select("id, name").single();
      if (makeErr || !made) return { error: `Could not save the contractor. (Ref: contractor-${makeErr?.code ?? "unknown"})` };
      contractorId = made.id;
      contractorName = made.name;
    }
  }

  const { data: job, error } = await supabase
    .from("requests")
    .insert({
      source: "contractor",
      contractor_id: contractorId,
      status: "confirmed",
      issue: issueForService(v.service),
      name: contractorName,
      address: v.address,
      preferred_date: v.date,
      preferred_time: "10:00", // unused for contractor jobs
      text_consent: false,
      area: "core",
      confirmed_date: v.date,
      confirmed_time: v.time,
      block_hours: v.hours,
      confirmed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !job) {
    if (error?.code === EXCLUSION_VIOLATION) {
      return { error: "That time overlaps a job that is already held. Pick another time." };
    }
    return { error: `Could not save. (Ref: add-${error?.code ?? "unknown"})` };
  }
  redirect("/admin/today?added=1");
}

export async function cancelJob(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin");
  const { error } = await supabase.from("requests").update({ status: "cancelled" }).eq("id", id);
  redirect(error ? `/admin/${id}?error=save` : "/admin/today");
}

// Cancel a client's booking. A paid deposit comes back only if the visit is more than 24 hours away.
export async function cancelBooking(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin");

  const { data: row } = await supabase
    .from("requests")
    .select(`${CLIENT_COLUMNS}, source, status, confirmed_date, confirmed_time, block_hours`)
    .eq("id", id).single();
  if (!row || row.source !== "client" || !["offered", "confirmed"].includes(row.status)) {
    redirect(`/admin/${id}?error=save`);
  }
  const slot = { date: row.confirmed_date as string, time: row.confirmed_time as string, hours: row.block_hours as number };
  const paid = row.status === "confirmed";
  const refund = paid ? refundDue(slot.date, slot.time) : false;

  const { error } = await supabase
    .from("requests")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancel_refund: paid ? refund : null })
    .eq("id", id);
  if (error) redirect(`/admin/${id}?error=save`);

  const sent = await sendEmail({ to: row.email, ...cancelEmail(row, slot, refund, paid) });
  if (!sent.ok) console.error(`[cancel] client email not sent: ${sent.reason}`);
  redirect(`/admin/${id}?email=${sent.ok ? "sent" : "failed"}`);
}

export async function markRefunded(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const id = String(form.get("id") ?? "");
  if (!supabase || !/^[0-9a-f-]{36}$/i.test(id)) redirect("/admin");
  const { error } = await supabase.from("requests").update({ refunded_at: new Date().toISOString() }).eq("id", id);
  redirect(`/admin/${id}${error ? "?error=save" : ""}`);
}
