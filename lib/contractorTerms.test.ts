import { describe, expect, it } from "vitest";
import { CONTRACTOR_TERMS, daysBetween, feeStage, LATE_FEE_CENTS, NET_DAYS } from "./contractorTerms";

describe("contractor terms", () => {
  it("states net 15, the $250 fee after 30 days and the trip fee rule", () => {
    const all = JSON.stringify(CONTRACTOR_TERMS);
    expect(NET_DAYS).toBe(15);
    expect(LATE_FEE_CENTS).toBe(25000);
    expect(all).toContain("15 days");
    expect(all).toContain("$250");
    expect(all).toContain("30 days");
    expect(all).toContain("$350");
    expect(all).toContain("before our next scheduled visit");
  });
  it("counts days across a month end", () => {
    expect(daysBetween("2026-11-20", "2026-12-20")).toBe(30);
  });
  it("waits, reminds on day 25, adds the fee after day 30", () => {
    expect(feeStage("2026-11-01", "2026-11-25")).toBe("none"); // day 24
    expect(feeStage("2026-11-01", "2026-11-26")).toBe("remind"); // day 25
    expect(feeStage("2026-11-01", "2026-12-01")).toBe("remind"); // day 30
    expect(feeStage("2026-11-01", "2026-12-02")).toBe("fee"); // day 31
  });
});
