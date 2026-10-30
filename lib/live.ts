// What a client sees on visit day: Booked, On the way, Arrived, Done. Pure, so it is easy to test.
export type LiveRow = {
  status: string;
  confirmed_date: string | null;
  en_route_at?: string | null;
  arrived_at?: string | null;
  left_at?: string | null;
};

export const LIVE_STEPS = ["Booked", "On the way", "Arrived", "Done"] as const;

const clock = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }).format(new Date(iso));

export function liveState(r: LiveRow, today: string) {
  if (r.status !== "confirmed" || r.confirmed_date !== today) return null;
  if (r.left_at) {
    return { step: 4, headline: "Your visit is done", detail: "Thank you. Your final invoice and report follow." };
  }
  if (r.arrived_at) {
    return {
      step: 3,
      headline: "Your assessment is in progress",
      detail: `We arrived at ${clock(r.arrived_at)}. We will walk you through what we find.`,
    };
  }
  if (r.en_route_at) {
    return {
      step: 2,
      headline: "Your assessor is on the way",
      detail: `We left at ${clock(r.en_route_at)}. This page updates by itself.`,
    };
  }
  return {
    step: 1,
    headline: "Today is your visit",
    detail: "We message you when we leave for your address. This page updates by itself.",
  };
}
