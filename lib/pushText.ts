// Short wording for phone alerts. Pure, so it is easy to test.
import { formatDateLabel } from "./dates";
import { formatTime, issueLabel } from "./labels";
import { clientTypeLabel } from "./intake";
import type { PushMsg } from "./push";

export function newRequestPush(r: { client_type?: string; issue: string; city: string; preferred_date: string; preferred_time: string; id: string }): PushMsg {
  return {
    title: r.client_type && r.client_type !== "homeowner" ? `New request: ${clientTypeLabel(r.client_type)}` : "New request",
    body: `${issueLabel(r.issue)}, ${r.city}. Wants ${formatDateLabel(r.preferred_date)} at ${formatTime(r.preferred_time)}.`,
    url: `/admin/${r.id}`,
  };
}

// A briefing subject like "Today: 2 inspections, first at 10:00 AM" becomes the title; the rest is the body.
export function briefingPush(subject: string, text: string): PushMsg {
  const waiting = text.split("Waiting on you:")[1]?.split("\n\n")[0]?.split("\n").map((l) => l.replace(/^- /, "").trim()).filter(Boolean) ?? [];
  return { title: subject, body: waiting.length ? waiting.join(", ") : "Open the app for the details.", url: "/admin/today" };
}

// A client booked and paid on their own.
export function bookedPush(r: { name: string; id: string }, when: string): PushMsg {
  return { title: "Booked and paid", body: `${r.name}, ${when}.`, url: `/admin/${r.id}` };
}

// A client paid for a time that was already taken. Needs a refund.
export function refundPush(r: { name: string; id: string }): PushMsg {
  return { title: "Refund needed", body: `${r.name} paid for a time that was taken.`, url: `/admin/${r.id}` };
}
