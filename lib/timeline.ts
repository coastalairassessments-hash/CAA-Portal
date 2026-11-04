// The client's job timeline. It moves on dates and on things Cory already does (the visit, the report upload),
// so it needs no extra input. Windows are estimates and worded that way. Pure, so it is easy to test.
import { addDays, formatDateLabel, todayInNewYork, weekdayOf } from "./dates";
import { reportState } from "./report";

export const LAB_BUSINESS_DAYS = 2; // results usually come back the next day; 2 leaves room for shipping
export const REPORT_BUSINESS_DAYS = 3; // report ready within 3 business days of the inspection

export type TimelineRow = {
  status: string;
  confirmed_date: string | null;
  left_at?: string | null;
  lab_samples?: number | null;
  report_path?: string | null;
  report_released_at?: string | null;
  final_paid_at?: string | null;
};

export type TimelineStep = {
  key: "booked" | "visit" | "lab" | "report" | "delivered";
  label: string;
  state: "done" | "current" | "upcoming";
  note: string;
};

// Mon-Fri only. Day 0 is the start date itself.
export function addBusinessDays(start: string, days: number): string {
  let d = start;
  let left = days;
  while (left > 0) {
    d = addDays(d, 1);
    const w = weekdayOf(d);
    if (w !== 0 && w !== 6) left -= 1;
  }
  return d;
}

// Null when there is no timeline to show yet (not booked) or any more (cancelled, declined).
export function timeline(r: TimelineRow, now: Date = new Date()): TimelineStep[] | null {
  if (r.status !== "confirmed") return null;
  const today = todayInNewYork(now);
  const visited = Boolean(r.left_at);
  const visitDate = r.left_at ? todayInNewYork(new Date(r.left_at)) : r.confirmed_date;
  const rep = reportState(r);
  const hasLab = (r.lab_samples ?? 0) > 0;

  const labDone = visited && (rep !== "none" || (visitDate !== null && today >= addBusinessDays(visitDate, LAB_BUSINESS_DAYS)));
  const reportDone = rep !== "none";
  const delivered = rep === "ready";

  const plan: { key: TimelineStep["key"]; label: string; done: boolean; note: (cur: boolean) => string }[] = [
    { key: "booked", label: "Booked", done: true, note: () => "" },
    {
      key: "visit",
      label: "Inspection",
      done: visited,
      note: () => (r.confirmed_date ? `Your visit is ${formatDateLabel(r.confirmed_date)}.` : ""),
    },
  ];
  if (hasLab) {
    plan.push({
      key: "lab",
      label: "Lab results",
      done: labDone,
      note: () => "Your samples are at the lab. Results usually take 1 to 2 business days.",
    });
  }
  plan.push(
    {
      key: "report",
      label: "Report in preparation",
      done: reportDone,
      note: () =>
        visitDate
          ? `We are preparing your report. Expected by ${formatDateLabel(addBusinessDays(visitDate, REPORT_BUSINESS_DAYS))}.`
          : "",
    },
    {
      key: "delivered",
      label: "Report delivered",
      done: delivered,
      note: () => (rep === "locked" ? "Your report is ready. Pay your final invoice to unlock it." : ""),
    },
  );

  let currentAssigned = false;
  return plan.map((p) => {
    if (p.done) return { key: p.key, label: p.label, state: "done", note: "" };
    if (!currentAssigned) {
      currentAssigned = true;
      return { key: p.key, label: p.label, state: "current", note: p.note(true) };
    }
    return { key: p.key, label: p.label, state: "upcoming", note: "" };
  });
}
