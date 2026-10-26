import { describe, expect, it } from "vitest";
import { apiBase, authorizeUrl, basicAuth, qbConfig, tokenDates } from "./qb";

const env = { QB_CLIENT_ID: "id1", QB_CLIENT_SECRET: "sec1", QB_ENV: "sandbox" };

describe("quickbooks config", () => {
  it("reads env and defaults to sandbox and the live site", () => {
    const c = qbConfig(env);
    expect(c.env).toBe("sandbox");
    expect(c.redirectUri).toBe("https://caaportal.netlify.app/api/qb/callback");
  });
  it("uses SITE_URL for the redirect and cleans pasted quotes", () => {
    const c = qbConfig({ ...env, QB_CLIENT_ID: ' "id1" ', SITE_URL: "https://book.coastalairassessments.com/" });
    expect(c.clientId).toBe("id1");
    expect(c.redirectUri).toBe("https://book.coastalairassessments.com/api/qb/callback");
  });
  it("only goes live when told to", () => {
    expect(qbConfig({ ...env, QB_ENV: "production" }).env).toBe("production");
    expect(qbConfig({ ...env, QB_ENV: "prod" }).env).toBe("sandbox");
  });
  it("fails clearly when keys are missing", () => {
    expect(() => qbConfig({})).toThrow("Missing QB_CLIENT_ID");
  });
});

describe("quickbooks urls", () => {
  it("builds the authorize link with state and the exact redirect", () => {
    const u = new URL(authorizeUrl(qbConfig(env), "abc"));
    expect(u.origin + u.pathname).toBe("https://appcenter.intuit.com/connect/oauth2");
    expect(u.searchParams.get("state")).toBe("abc");
    expect(u.searchParams.get("scope")).toBe("com.intuit.quickbooks.accounting");
    expect(u.searchParams.get("redirect_uri")).toBe("https://caaportal.netlify.app/api/qb/callback");
  });
  it("picks the sandbox or live api", () => {
    expect(apiBase({ env: "sandbox" })).toContain("sandbox-");
    expect(apiBase({ env: "production" })).toBe("https://quickbooks.api.intuit.com");
  });
  it("encodes basic auth", () => {
    expect(basicAuth({ clientId: "a", clientSecret: "b" })).toBe("Basic YTpi");
  });
  it("expires tokens a little early", () => {
    const d = tokenDates({ expires_in: 3600, x_refresh_token_expires_in: 8726400 }, 0);
    expect(Date.parse(d.access_expires_at)).toBe(3480 * 1000);
    expect(Date.parse(d.refresh_expires_at)).toBe(8726400 * 1000);
  });
});
