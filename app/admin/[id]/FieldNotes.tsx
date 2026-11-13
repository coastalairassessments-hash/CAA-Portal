import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { isClientPhoto } from "@/lib/fieldNotes";
import { formatStamp } from "@/lib/labels";
import { addNote, deleteNote, deletePhoto } from "../fieldActions";
import PhotoPicker from "./PhotoPicker";

type Note = { id: string; body: string; created_at: string };
type Photo = { id: string; path: string; created_at: string };

export default async function FieldNotes({ id, open }: { id: string; open: boolean }) {
  await connection();
  const supabase = await supabaseForUser();
  const [notes, photos] = await Promise.all([
    supabase.from("job_notes").select("id, body, created_at").eq("request_id", id).order("created_at", { ascending: false }),
    supabase.from("job_photos").select("id, path, created_at").eq("request_id", id).order("created_at", { ascending: true }),
  ]);
  const noteRows = (notes.data ?? []) as Note[];
  const photoRows = (photos.data ?? []) as Photo[];
  const missing = !!(notes.error || photos.error);

  const signed = photoRows.length
    ? await supabase.storage.from("job-photos").createSignedUrls(photoRows.map((p) => p.path), 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const urlOf = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <details className="adm-group" id="field" open={open || noteRows.length + photoRows.length > 0 || undefined}>
      <summary>
        Field notes <span className="v">{noteRows.length} notes · {photoRows.length} photos</span>
      </summary>
      {missing && <p className="adm-err">Field notes are not set up yet. Run the 0020 SQL in Supabase.</p>}

      <h3 className="adm-sub">Notes</h3>
      <form action={addNote} className="adm-field">
        <input type="hidden" name="id" value={id} />
        <label htmlFor="note-body">Add a note</label>
        <textarea id="note-body" name="body" rows={3} required maxLength={4000} />
        <button className="adm-btn primary wide" type="submit">Save note</button>
      </form>
      {noteRows.map((n) => (
        <div key={n.id} className="adm-note">
          <div className="adm-muted">{formatStamp(n.created_at)}</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{n.body}</div>
          <form action={deleteNote}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="row" value={n.id} />
            <button className="adm-quiet" type="submit">Delete</button>
          </form>
        </div>
      ))}

      <h3 className="adm-sub">Photos</h3>
      <PhotoPicker id={id} />
      <div className="adm-photos">
        {photoRows.map((p) => {
          const url = urlOf.get(p.path);
          return (
            <figure key={p.id}>
              {url ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Photo ${formatStamp(p.created_at)}`} loading="lazy" /></a> : <div className="adm-muted">Not available</div>}
              <figcaption className="adm-muted">{isClientPhoto(p.path) ? "From client · " : ""}{formatStamp(p.created_at)}</figcaption>
              <form action={deletePhoto}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="row" value={p.id} />
                <button className="adm-quiet" type="submit">Delete</button>
              </form>
            </figure>
          );
        })}
      </div>
    </details>
  );
}
