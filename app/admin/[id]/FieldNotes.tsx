import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { SAMPLE_KINDS, isClientPhoto, sampleNote } from "@/lib/fieldNotes";
import { formatStamp } from "@/lib/labels";
import { addNote, addSample, deleteNote, deletePhoto, deleteSample } from "../fieldActions";
import PhotoPicker from "./PhotoPicker";

type Note = { id: string; body: string; created_at: string };
type Photo = { id: string; path: string; created_at: string };
type Sample = { id: string; label: string; location: string | null; kind: string; lab_ref: string | null; created_at: string };

const kindLabel = (k: string) => SAMPLE_KINDS.find((x) => x.value === k)?.label ?? k;

export default async function FieldNotes({ id, billedSamples, open }: { id: string; billedSamples: number | null; open: boolean }) {
  await connection();
  const supabase = await supabaseForUser();
  const [notes, photos, samples] = await Promise.all([
    supabase.from("job_notes").select("id, body, created_at").eq("request_id", id).order("created_at", { ascending: false }),
    supabase.from("job_photos").select("id, path, created_at").eq("request_id", id).order("created_at", { ascending: true }),
    supabase.from("job_samples").select("id, label, location, kind, lab_ref, created_at").eq("request_id", id).order("created_at", { ascending: true }),
  ]);
  const noteRows = (notes.data ?? []) as Note[];
  const photoRows = (photos.data ?? []) as Photo[];
  const sampleRows = (samples.data ?? []) as Sample[];
  const missing = !!(notes.error || photos.error || samples.error);

  const signed = photoRows.length
    ? await supabase.storage.from("job-photos").createSignedUrls(photoRows.map((p) => p.path), 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const urlOf = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));
  const hint = sampleNote(sampleRows.length, billedSamples);

  return (
    <details className="adm-group" id="field" open={open || noteRows.length + photoRows.length + sampleRows.length > 0 || undefined}>
      <summary>
        Field notes <span className="v">{noteRows.length} notes · {photoRows.length} photos · {sampleRows.length} samples</span>
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

      <h3 className="adm-sub">Samples</h3>
      {hint && <p className="adm-muted">{hint}</p>}
      {sampleRows.map((s) => (
        <div key={s.id} className="adm-note">
          <strong>{s.label}</strong> · {kindLabel(s.kind)}
          {s.location ? ` · ${s.location}` : ""}
          {s.lab_ref ? ` · Lab ref ${s.lab_ref}` : ""}
          <form action={deleteSample}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="row" value={s.id} />
            <button className="adm-quiet" type="submit">Delete</button>
          </form>
        </div>
      ))}
      <form action={addSample} className="adm-field">
        <input type="hidden" name="id" value={id} />
        <label htmlFor="s-label">Label (A1, B2...)</label>
        <input id="s-label" name="label" required maxLength={80} />
        <label htmlFor="s-kind">Type</label>
        <select id="s-kind" name="kind" defaultValue="air">
          {SAMPLE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <label htmlFor="s-loc">Where</label>
        <input id="s-loc" name="location" maxLength={200} />
        <label htmlFor="s-ref">Lab reference (optional)</label>
        <input id="s-ref" name="lab_ref" maxLength={80} />
        <button className="adm-btn primary wide" type="submit">Add sample</button>
      </form>
    </details>
  );
}
