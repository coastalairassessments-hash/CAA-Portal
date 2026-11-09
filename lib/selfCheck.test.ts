import { describe, expect, it } from "vitest";
import { failureMessage, runSelfCheck, type SelfCheckDeps } from "./selfCheck";

const good = (): SelfCheckDeps => ({
  fetchPage: async (path) => ({ status: 200, text: path === "/" ? "Request a date" : "Who are you?" }),
  loadSlots: async () => [1, 2],
  depositInvoice: async () => ({ link: true }),
  emailConfigured: () => true,
});

describe("self check", () => {
  it("passes when everything works, with no message", async () => {
    const checks = await runSelfCheck(good());
    expect(checks.every((c) => c.ok)).toBe(true);
    expect(failureMessage(checks)).toBeNull();
  });
  it("names the deposit invoice when QuickBooks refuses", async () => {
    const checks = await runSelfCheck({ ...good(), depositInvoice: async () => { throw new Error("stopped while making the test invoice: QuickBooks error 400"); } });
    const msg = failureMessage(checks)!;
    expect(msg).toContain("Deposit invoice");
    expect(msg).toContain("QuickBooks error 400");
    expect(checks.filter((c) => !c.ok)).toHaveLength(1);
  });
  it("catches a broken booking form", async () => {
    const checks = await runSelfCheck({ ...good(), fetchPage: async (p) => (p === "/request" ? { status: 500, text: "" } : { status: 200, text: "Request a date" }) });
    expect(failureMessage(checks)).toContain("Booking form (answered 500)");
  });
  it("catches a page that loads but is wrong", async () => {
    const checks = await runSelfCheck({ ...good(), fetchPage: async () => ({ status: 200, text: "Application error" }) });
    expect(failureMessage(checks)).toContain("Home page");
  });
  it("catches missing email settings and a dead database", async () => {
    const checks = await runSelfCheck({ ...good(), emailConfigured: () => false, loadSlots: async () => { throw new Error("db down"); } });
    const msg = failureMessage(checks)!;
    expect(msg).toContain("Email");
    expect(msg).toContain("Calendar data (db down)");
  });
});
