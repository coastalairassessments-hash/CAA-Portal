"use server";
import { redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import { MAX_PHOTO_BYTES, parseNote, parseRowId, parseSample, photoPath, validPhotoPath } from "@/lib/fieldNotes";

async function adminClient() {
  const supabase = await supabaseForUser();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: ok } = await supabase.rpc("is_admin");
  return ok ? supabase : null;
}

const back = (id: string, error = false) => redirect(`/admin/${id}${error ? "?error=save" : "?saved=field"}#field`);
const jobId = (form: FormData) => String(form.get("id") ?? "");
const validId = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

export async function addNote(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const parsed = parseNote({ id: jobId(form), body: form.get("body") });
  if (!supabase || !parsed.success) return back(validId(jobId(form)) ? jobId(form) : "", true);
  const { error } = await supabase.from("job_notes").insert({ request_id: parsed.data.id, body: parsed.data.body });
  back(parsed.data.id, !!error);
}

export async function deleteNote(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const parsed = parseRowId({ id: jobId(form), row: form.get("row") });
  if (!supabase || !parsed.success) return back(validId(jobId(form)) ? jobId(form) : "", true);
  const { error } = await supabase.from("job_notes").delete().eq("id", parsed.data.row).eq("request_id", parsed.data.id);
  back(parsed.data.id, !!error);
}

export async function addSample(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const parsed = parseSample({
    id: jobId(form),
    label: form.get("label"),
    location: form.get("location") ?? "",
    kind: form.get("kind"),
    lab_ref: form.get("lab_ref") ?? "",
  });
  if (!supabase || !parsed.success) return back(validId(jobId(form)) ? jobId(form) : "", true);
  const { id, ...row } = parsed.data;
  const { error } = await supabase.from("job_samples").insert({ request_id: id, ...row });
  back(id, !!error);
}

export async function deleteSample(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const parsed = parseRowId({ id: jobId(form), row: form.get("row") });
  if (!supabase || !parsed.success) return back(validId(jobId(form)) ? jobId(form) : "", true);
  const { error } = await supabase.from("job_samples").delete().eq("id", parsed.data.row).eq("request_id", parsed.data.id);
  back(parsed.data.id, !!error);
}

// Called from the photo picker with an already-shrunk picture. Returns whether it saved.
export async function addPhoto(form: FormData): Promise<{ ok: boolean }> {
  const supabase = await adminClient();
  const id = jobId(form);
  const file = form.get("photo");
  if (!supabase || !validId(id) || !(file instanceof File)) return { ok: false };
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES || file.type !== "image/jpeg") return { ok: false };
  const path = photoPath(id);
  const up = await supabase.storage.from("job-photos").upload(path, file, { contentType: "image/jpeg", upsert: false });
  if (up.error) return { ok: false };
  const { error } = await supabase.from("job_photos").insert({ request_id: id, path });
  if (error) {
    await supabase.storage.from("job-photos").remove([path]);
    return { ok: false };
  }
  return { ok: true };
}

export async function deletePhoto(form: FormData): Promise<void> {
  const supabase = await adminClient();
  const parsed = parseRowId({ id: jobId(form), row: form.get("row") });
  if (!supabase || !parsed.success) return back(validId(jobId(form)) ? jobId(form) : "", true);
  const { data: photo } = await supabase.from("job_photos").select("path").eq("id", parsed.data.row).eq("request_id", parsed.data.id).maybeSingle();
  if (photo && validPhotoPath(parsed.data.id, photo.path)) {
    await supabase.storage.from("job-photos").remove([photo.path]);
    await supabase.from("job_photos").delete().eq("id", parsed.data.row);
  }
  back(parsed.data.id);
}
