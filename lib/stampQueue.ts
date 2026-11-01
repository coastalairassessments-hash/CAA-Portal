// Arrived / Left / On my way taps made with no signal. They wait on the phone with the moment they were tapped,
// then go to the server when the signal is back. Pure, so it is easy to test.
export type StampKind = "en_route_at" | "arrived_at" | "left_at";
export type Queued = { id: string; which: StampKind; at: string };

export const STAMP_KEY = "caa-stamps";
const KINDS: readonly string[] = ["en_route_at", "arrived_at", "left_at"];
const ID = /^[0-9a-f-]{36}$/i;

export const isStampKind = (v: unknown): v is StampKind => typeof v === "string" && KINDS.includes(v);

export function parseQueue(raw: string | null): Queued[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (q): q is Queued =>
        !!q && typeof q.id === "string" && ID.test(q.id) && isStampKind(q.which) && typeof q.at === "string" && !Number.isNaN(Date.parse(q.at)),
    );
  } catch {
    return [];
  }
}

// One waiting tap per job and kind. A second tap keeps the first time, which is when it really happened.
export function enqueue(queue: Queued[], item: Queued): Queued[] {
  if (queue.some((q) => q.id === item.id && q.which === item.which)) return queue;
  return [...queue, item];
}
export const dequeue = (queue: Queued[], item: Queued): Queued[] => queue.filter((q) => !(q.id === item.id && q.which === item.which));
export const waiting = (queue: Queued[], id: string, which: StampKind) => queue.some((q) => q.id === id && q.which === which);

// The server only believes a tap time that is recent and not in the future.
export const MAX_AGE_HOURS = 36;
export function acceptableAt(at: string, now: Date = new Date()): boolean {
  const t = Date.parse(at);
  if (Number.isNaN(t)) return false;
  const ms = now.getTime() - t;
  return ms >= -5 * 60_000 && ms <= MAX_AGE_HOURS * 3_600_000;
}
