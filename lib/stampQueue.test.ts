import { describe, expect, it } from "vitest";
import { acceptableAt, dequeue, enqueue, parseQueue, waiting, type Queued } from "./stampQueue";

const ID = "11111111-1111-1111-1111-111111111111";
const a: Queued = { id: ID, which: "arrived_at", at: "2026-11-03T15:00:00.000Z" };

describe("queue", () => {
  it("keeps the first tap time for the same job and kind", () => {
    const q = enqueue(enqueue([], a), { ...a, at: "2026-11-03T16:00:00.000Z" });
    expect(q).toHaveLength(1);
    expect(q[0].at).toBe(a.at);
  });
  it("holds different kinds separately and removes one at a time", () => {
    const left = { ...a, which: "left_at" as const };
    const q = enqueue(enqueue([], a), left);
    expect(q).toHaveLength(2);
    expect(dequeue(q, a)).toEqual([left]);
    expect(waiting(q, ID, "left_at")).toBe(true);
    expect(waiting(dequeue(q, left), ID, "left_at")).toBe(false);
  });
});

describe("parseQueue", () => {
  it("round-trips and drops junk", () => {
    expect(parseQueue(JSON.stringify([a, { id: "x", which: "arrived_at", at: a.at }, { id: ID, which: "bad", at: a.at }]))).toEqual([a]);
    expect(parseQueue("not json")).toEqual([]);
    expect(parseQueue(null)).toEqual([]);
    expect(parseQueue('{"a":1}')).toEqual([]);
  });
});

describe("acceptableAt", () => {
  const now = new Date("2026-11-03T16:00:00Z");
  it("takes recent times", () => expect(acceptableAt("2026-11-03T15:00:00Z", now)).toBe(true));
  it("takes a few minutes of clock drift", () => expect(acceptableAt("2026-11-03T16:03:00Z", now)).toBe(true));
  it("refuses the future and anything very old", () => {
    expect(acceptableAt("2026-11-03T17:00:00Z", now)).toBe(false);
    expect(acceptableAt("2026-11-01T00:00:00Z", now)).toBe(false);
    expect(acceptableAt("nope", now)).toBe(false);
  });
});
