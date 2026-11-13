"use server";
import { redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import { mapClients } from "@/lib/clientImport";

// One-time import of a Jobber or QuickBooks client export. Existing clients are left alone.
export async function importClients(form: FormData): Promise<void> {
  const supabase = await supabaseForUser();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: ok } = await supabase.rpc("is_admin");
  if (!ok) redirect("/admin");

  const file = form.get("file");
  const source = form.get("source") === "quickbooks" ? "quickbooks" : "jobber";
  if (!(file instanceof File) || file.size === 0) redirect("/admin/clients/import?error=nofile");
  if (file.size > 900_000) redirect("/admin/clients/import?error=big");
  const rows = mapClients(await file.text(), source);
  if (rows.length === 0) redirect("/admin/clients/import?error=empty");

  let added = 0;
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400);
    const { data: made, error } = await supabase.from("clients").upsert(chunk, { onConflict: "key", ignoreDuplicates: true }).select("id");
    if (error) {
      console.error("[clients] import failed:", error.code);
      redirect(`/admin/clients/import?error=${error.code === "42P01" ? "table" : "save"}`);
    }
    added += made?.length ?? 0;
  }
  redirect(`/admin/clients/import?done=${added}&seen=${rows.length}`);
}
