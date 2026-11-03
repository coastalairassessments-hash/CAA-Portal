"use server";
import { redirect } from "next/navigation";
import { serviceDb } from "@/lib/bookingServer";
import { consumeClientLogin, endClientSession, sendClientLink, startClientSession } from "@/lib/clientServer";

export async function requestLink(form: FormData): Promise<void> {
  const db = serviceDb();
  if (db) await sendClientLink(db, String(form.get("email") ?? "")).catch(() => undefined);
  redirect("/portal?sent=1");
}

export async function signIn(form: FormData): Promise<void> {
  const db = serviceDb();
  if (!db) redirect("/portal?error=1");
  const id = await consumeClientLogin(db, form.get("t"));
  if (!id || !(await startClientSession(db, id))) redirect("/portal?error=link");
  redirect("/portal");
}

export async function signOut(): Promise<void> {
  const db = serviceDb();
  if (db) await endClientSession(db);
  redirect("/portal");
}
