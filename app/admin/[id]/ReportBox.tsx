import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { REPORT_BUCKET, reportState, validReportPath } from "@/lib/report";
import { formatStamp } from "@/lib/labels";
import { finalInvoice, minutesOnSite } from "@/lib/billing";
import { formatMoney } from "@/lib/pricing";
import { releaseReport, removeReport, uploadAndInvoice, uploadReport } from "../reportActions";
import DropZone from "./DropZone";

type Row = { id: string; report_path?: string | null; report_uploaded_at?: string | null; report_released_at?: string | null; report_emailed_at?: string | null; final_paid_at?: string | null; qb_invoice_id?: string | null; final_invoice_no?: string | null; issue?: string; arrived_at?: string | null; left_at?: string | null; lab_samples?: number | null; extras_cents?: number | null; deposit_cents?: number | null; deposit_paid_at?: string | null };

const NOTES: Record<string, string> = {
  saved: "Report saved.",
  released: "Released. The client can open it now.",
  removed: "Report removed.",
  sent: "Report saved. Final invoice sent, and the client knows the report is waiting.",
  unsent: "Report saved. The invoice was made in QuickBooks but the email did not go out. Send it from QuickBooks.",
  qbconnect: "Report saved. QuickBooks is not connected, so no invoice went out.",
  qbfail: "Report saved. The invoice did not go through. Try Send final invoice under Money.",
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
  const inv = r.issue
    ? finalInvoice({
        issue: r.issue,
        minutes: minutesOnSite(r.arrived_at ?? null, r.left_at ?? null),
        samples: r.lab_samples ?? null,
        extrasCents: r.extras_cents ?? 0,
        depositPaidCents: r.deposit_paid_at && typeof r.deposit_cents === "number" ? r.deposit_cents : null,
      })
    : null;
  const needsInvoice = !r.qb_invoice_id && !!inv;
  const note = flag ? NOTES[flag] : undefined;

  return (
    <details className="adm-group" id="report" open={!!flag || state !== "none" || undefined}>
      <summary>
        Report <span className="v">{state === "none" ? "Not uploaded" : state === "locked" ? "Locked until paid" : "Client can open it"}</span>
      </summary>
      {note && <p className={["size","type","error","unsent","qbconnect","qbfail"].includes(flag ?? "") ? "adm-err" : "adm-ok"}>{note}</p>}
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
      {needsInvoice ? (
        <form action={uploadAndInvoice} className="adm-field adm-uploadform">
          <input type="hidden" name="id" value={r.id} />
          <DropZone />
          <p className="adm-muted">
            Balance due {formatMoney(inv.balance)} (total {formatMoney(inv.total)}). Uploading sends this invoice and tells the client the report is waiting. Check Money first.
          </p>
          <button className="adm-btn primary wide" type="submit">Upload report and send {formatMoney(inv.balance)} invoice</button>
        </form>
      ) : (
        <form action={uploadReport} className="adm-field adm-uploadform">
          <input type="hidden" name="id" value={r.id} />
          <DropZone />
          <button className="adm-btn primary wide" type="submit">{r.report_path ? "Replace report" : "Upload report"}</button>
        </form>
      )}
    </details>
  );
}
