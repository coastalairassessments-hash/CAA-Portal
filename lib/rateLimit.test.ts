import { describe, expect, it } from "vitest";
import { makeLimiter, requestIp } from "./rateLimit";

describe("makeLimiter", () => {
  it("allows up to the limit, then refuses", () => {
    const t = 0;
    const allow = makeLimiter(3, 1000, () => t);
    expect([allow("a"), allow("a"), allow("a"), allow("a")]).toEqual([true, true, true, false]);
  });
  it("counts each visitor separately", () => {
    const allow = makeLimiter(1, 1000, () => 0);
    expect(allow("a")).toBe(true);
    expect(allow("b")).toBe(true);
    expect(allow("a")).toBe(false);
  });
  it("starts over after the window", () => {
    let t = 0;
    const allow = makeLimiter(1, 1000, () => t);
    expect(allow("a")).toBe(true);
    expect(allow("a")).toBe(false);
    t = 1001;
    expect(allow("a")).toBe(true);
  });
});

describe("requestIp", () => {
  it("prefers Netlify's header, then the first forwarded address", () => {
    expect(requestIp(new Request("http://x", { headers: { "x-nf-client-connection-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" } }))).toBe("1.1.1.1");
    expect(requestIp(new Request("http://x", { headers: { "x-forwarded-for": "2.2.2.2, 3.3.3.3" } }))).toBe("2.2.2.2");
    expect(requestIp(new Request("http://x"))).toBe("unknown");
  });
});
