import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { REPORT_BUCKET, reportState, validReportPath } from "@/lib/report";
import { formatStamp } from "@/lib/labels";
import { releaseReport, removeReport, uploadReport } from "../reportActions";

type Row = { id: string; report_path?: string | null; report_uploaded_at?: string | null; report_released_at?: string | null; report_emailed_at?: string | null; final_paid_at?: string | null };

const NOTES: Record<string, string> = {
  saved: "Report saved.",
  released: "Released. The client can open it now.",
  removed: "Report removed.",
  size: "That file is empty or over 10 MB.",
  type: "That is not a PDF.",
  error: "Something did not save. Try again.",
};

export default async function ReportBox({ r, flag }: { r: Row; flag?: string }) {
  await connection();
  const state = reportState(r);
  let openUrl: string | null = null;
  if (r.report_path && validReportPath(r.id, r.report_path)) {
    const supabase = await supabaseForUser();
    const { data } = await supabase.storage.from(REPORT_BUCKET).createSignedUrl(r.report_path, 600);
    openUrl = data?.signedUrl ?? null;
  }
  const note = flag ? NOTES[flag] : undefined;

  return (
    <details className="adm-group" id="report" open={!!flag || state !== "none" || undefined}>
      <summary>
        Report <span className="v">{state === "none" ? "Not uploaded" : state === "locked" ? "Locked until paid" : "Client can open it"}</span>
      </summary>
      {note && <p className={flag === "size" || flag === "type" || flag === "error" ? "adm-err" : "adm-ok"}>{note}</p>}
      {r.report_path && (
        <>
          <p className="adm-line">
            Uploaded {formatStamp(r.report_uploaded_at ?? "")}.{" "}
            {state === "ready"
              ? r.report_emailed_at
                ? `Client emailed ${formatStamp(r.report_emailed_at)}.`
                : "Client email not sent yet."
              : "The client sees it unlocked once the final invoice is paid."}
          </p>
          {openUrl && <a className="adm-btn wide" href={openUrl} target="_blank" rel="noreferrer">Open report</a>}
          {state === "locked" && (
            <form action={releaseReport}>
              <input type="hidden" name="id" value={r.id} />
              <button className="adm-btn primary wide" type="submit">Release now</button>
            </form>
          )}
          <form action={removeReport}>
            <input type="hidden" name="id" value={r.id} />
            <button className="adm-quiet" type="submit">Remove report</button>
          </form>
        </>
      )}
      <form action={uploadReport} className="adm-field">
        <input type="hidden" name="id" value={r.id} />
        <label htmlFor="report-file">{r.report_path ? "Replace the PDF" : "Attach the PDF (up to 10 MB)"}</label>
        <input id="report-file" name="report" type="file" accept="application/pdf" required />
        <button className="adm-btn primary wide" type="submit">Upload report</button>
      </form>
    </details>
  );
}
