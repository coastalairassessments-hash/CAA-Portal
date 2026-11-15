"use server";
import { redirect } from "next/navigation";
import { serviceDb, validToken } from "@/lib/bookingServer";
import { CONTRACTOR_TERMS_VERSION } from "@/lib/contractorTerms";

// A contractor taps "I agree". Stores the version and the moment. Safe to tap twice.
export async function acceptTerms(form: FormData): Promise<void> {
  const token = String(form.get("token") ?? "");
  const db = serviceDb();
  if (!db || !validToken(token)) redirect("/");
  await db
    .from("contractors")
    .update({ terms_accepted_at: new Date().toISOString(), terms_version: CONTRACTOR_TERMS_VERSION })
    .eq("terms_token", token)
    .or(`terms_version.is.null,terms_version.neq.${CONTRACTOR_TERMS_VERSION}`);
  redirect(`/contractor/terms/${token}?done=1`);
}
