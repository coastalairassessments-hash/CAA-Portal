import { expect, test } from "@playwright/test";

const JOB = "11111111-1111-1111-1111-111111111111";
const TOKEN = "a".repeat(32);
const noFollow = { maxRedirects: 0 };

test.describe("a stranger with no sign-in", () => {
  test("cannot open a client report", async ({ request }) => {
    const res = await request.get(`/portal/report/${JOB}`, noFollow);
    expect(res.status()).toBeGreaterThanOrEqual(300);
    expect(res.status()).toBeLessThan(400);
    expect(res.headers()["location"]).toContain("/portal?need=report");
  });

  test("cannot open a contractor report", async ({ request }) => {
    const res = await request.get(`/contractor/report/${JOB}`, noFollow);
    expect(res.status()).toBeGreaterThanOrEqual(300);
    expect(res.status()).toBeLessThan(400);
    expect(res.headers()["location"]).toContain("/contractor");
  });

  test("gets nowhere with a made-up booking link", async ({ request }) => {
    // The page streams, so the status can already be 200. What counts is that the body says "not found" and holds no booking.
    for (const path of [`/booking/${TOKEN}`, "/booking/not-a-real-token"]) {
      const res = await request.get(path);
      const html = await res.text();
      expect(res.status() === 404 || html.includes("NEXT_HTTP_ERROR_FALLBACK;404"), path).toBe(true);
      expect(html, path).not.toMatch(/Open your report|Cancel this booking|Pick a different time/);
    }
    const report = await request.get(`/booking/${TOKEN}/report`, noFollow);
    expect(report.headers()["location"] ?? "").not.toContain("/portal/report/");
  });

  test("cannot see admin pages or any job data", async ({ request }) => {
    // With no login the pages must show nothing but an empty shell, whether they redirect or fail closed.
    for (const path of ["/admin", `/admin/${JOB}`, "/admin/today", "/admin/clients", "/admin/week"]) {
      const res = await request.get(path, noFollow);
      const html = await res.text();
      expect(res.status(), path).toBeLessThan(500);
      expect(html, path).not.toMatch(/Needs approval|In motion|Send final invoice|Upload report|Field notes|Mark paid/);
    }
  });
});

test.describe("sign-in pages", () => {
  test("show only a sign-in form, never client data", async ({ request }) => {
    const html = await (await request.get("/portal")).text();
    expect(html).toContain('name="email"');
    expect(html).not.toMatch(/Open your report|View booking details/);
  });

  test("stay out of search engines", async ({ request }) => {
    for (const path of ["/portal", `/portal/verify?t=${"b".repeat(64)}`, "/contractor", `/booking/${TOKEN}`]) {
      const res = await request.get(path);
      if (res.status() === 404) continue; // a missing booking shows no page at all
      expect(await res.text(), path).toMatch(/noindex/);
    }
  });

  test("a bad sign-in link does not sign anyone in", async ({ request }) => {
    const res = await request.get(`/portal/verify?t=${"c".repeat(64)}`);
    expect(res.status()).toBe(200);
    expect(await res.text()).not.toMatch(/Open your report/);
  });
});

test.describe("public endpoints", () => {
  test("the address lookup gives nothing away without a key", async ({ request }) => {
    const res = await request.get("/api/address?q=12+Palm+Street");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ suggestions: [] });
  });

  test("the scheduled-job endpoints refuse callers without the key", async ({ request }) => {
    for (const path of ["/api/briefing", "/api/payments"]) {
      expect((await request.get(path)).status(), path).toBe(401);
      expect((await request.get(path, { headers: { "x-cron-key": "wrong" } })).status(), path).toBe(401);
    }
  });

  test("the request endpoint refuses oversized and broken bodies", async ({ request }) => {
    const big = await request.post("/api/requests", { data: { notes: "x".repeat(25_000) } });
    expect(big.status()).toBe(413);
    const broken = await request.post("/api/requests", { headers: { "content-type": "application/json" }, data: Buffer.from("{not json") });
    expect(broken.status()).toBe(400);
  });
});
