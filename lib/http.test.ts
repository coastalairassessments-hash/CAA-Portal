import { describe, expect, it } from "vitest";
import { BodyTooLargeError, cronAuthorized, makeThrottle, readLimitedText, safeEqual } from "./http";

const post = (body: BodyInit, headers: Record<string, string> = {}) =>
  new Request("http://x/api", { method: "POST", body, headers, duplex: "half" } as RequestInit);

function streamOf(parts: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(c) {
      for (const p of parts) c.enqueue(enc.encode(p));
      c.close();
    },
  });
}

describe("readLimitedText", () => {
  it("returns a small body", async () => {
    expect(await readLimitedText(post('{"a":1}'), 100)).toBe('{"a":1}');
  });
  it("refuses a body whose header says it is too big", async () => {
    await expect(readLimitedText(post("x", { "content-length": "999999" }), 100)).rejects.toBeInstanceOf(BodyTooLargeError);
  });
  it("refuses a chunked body with no length header once the bytes pass the limit", async () => {
    const req = post(streamOf(["a".repeat(60), "b".repeat(60)]));
    expect(req.headers.get("content-length")).toBeNull();
    await expect(readLimitedText(req, 100)).rejects.toBeInstanceOf(BodyTooLargeError);
  });
  it("counts bytes, not characters", async () => {
    await expect(readLimitedText(post("é".repeat(60)), 100)).rejects.toBeInstanceOf(BodyTooLargeError);
  });
  it("accepts a body exactly at the limit", async () => {
    expect(await readLimitedText(post("a".repeat(100)), 100)).toHaveLength(100);
  });
});

describe("safeEqual / cronAuthorized", () => {
  it("matches only identical non-empty secrets", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("", "")).toBe(false);
    expect(safeEqual(null, "abc")).toBe(false);
    expect(safeEqual("abc", undefined)).toBe(false);
  });
  it("authorizes a cron call by its header", () => {
    const req = (k?: string) => new Request("http://x", { headers: k ? { "x-cron-key": k } : {} });
    expect(cronAuthorized(req("s3cret"), "s3cret")).toBe(true);
    expect(cronAuthorized(req("wrong"), "s3cret")).toBe(false);
    expect(cronAuthorized(req(), "s3cret")).toBe(false);
    expect(cronAuthorized(req("s3cret"), undefined)).toBe(false); // no secret configured: nothing gets in
    expect(cronAuthorized(req(""), "")).toBe(false);
  });
});

describe("makeThrottle", () => {
  it("allows up to the limit inside the window, then refuses, then recovers", () => {
    let t = 0;
    const th = makeThrottle(3, 1000, () => t);
    expect([th.take("a"), th.take("a"), th.take("a"), th.take("a")]).toEqual([true, true, true, false]);
    expect(th.take("b")).toBe(true); // another caller is unaffected
    t = 1001;
    expect(th.take("a")).toBe(true);
  });
});
