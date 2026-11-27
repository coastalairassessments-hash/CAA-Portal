import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import config, { SECURITY_HEADERS } from "../next.config";
import robots from "../app/robots";

describe("security headers", () => {
  it("are applied to every path", async () => {
    const rules = await config.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe("/:path*");
    expect(rules[0].headers).toBe(SECURITY_HEADERS);
  });
  it("forbid framing, sniffing and leaking a tokenised address to other sites", () => {
    const h = Object.fromEntries(SECURITY_HEADERS.map((x) => [x.key, x.value]));
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(h["Strict-Transport-Security"]).toMatch(/max-age=\d{7,}/);
    expect(h["Permissions-Policy"]).toContain("geolocation=()");
  });
  it("does not announce the framework", () => {
    expect(config.poweredByHeader).toBe(false);
  });
});

describe("robots", () => {
  it("keeps private link pages out of search", () => {
    const rule = (robots().rules as { disallow: string[] }[])[0];
    for (const p of ["/admin", "/booking/", "/pay/", "/invoice/", "/contractor", "/api/"]) expect(rule.disallow).toContain(p);
  });
});

// The three scheduled-job routes and nothing else decide who may run them: they must all go
// through the one shared check, never compare the key themselves.
describe("cron routes", () => {
  for (const f of ["briefing", "payments", "selfcheck"]) {
    it(`${f} uses the shared timing-safe check`, () => {
      const src = readFileSync(`app/api/${f}/route.ts`, "utf8");
      expect(src).toContain("cronAuthorized(req, secret)");
      expect(src).not.toMatch(/x-cron-key"\)\s*[!=]==/);
    });
  }
});

describe("the public request endpoint", () => {
  it("counts bytes as they arrive instead of trusting Content-Length", () => {
    const src = readFileSync("app/api/requests/route.ts", "utf8");
    expect(src).toContain("await readLimitedText(request, MAX_BODY_BYTES)");
    expect(src).not.toMatch(/request\.(json|text)\(\)/);
    expect(src).not.toContain('headers.get("content-length")');
  });
  it("throttles the address proxy", () => {
    expect(readFileSync("app/api/address/route.ts", "utf8")).toContain("throttle.take(");
  });
});
