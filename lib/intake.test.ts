import { describe, expect, it } from "vitest";
import { intakeLines, isOrg, needsQuote, clientTypeLabel } from "./intake";
import { parseRequest } from "./request";

const NOW = new Date("2026-10-25T17:00:00Z");
const good = {
  issue: "water_damage", sizeBand: "under_2000", preferredDate: "2026-10-27", preferredTime: "10:00",
  name: "Pat", phone: "772-555-0142", email: "pat@example.com", address: "1 Main St", city: "Stuart", zip: "34994",
  textConsent: false, termsAccepted: true,
};

describe("intake", () => {
  it("still accepts a plain homeowner request", () => {
    const r = parseRequest(good, NOW);
    expect(r.success && r.data.clientType).toBe("homeowner");
  });
  it("needs a company from managers, contractors and businesses", () => {
    expect(parseRequest({ ...good, clientType: "manager" }, NOW).success).toBe(false);
    expect(parseRequest({ ...good, clientType: "manager", company: "Seaview HOA" }, NOW).success).toBe(true);
    expect(parseRequest({ ...good, clientType: "landlord" }, NOW).success).toBe(true);
  });
  it("drops blank follow-up answers and rejects bad ones", () => {
    const ok = parseRequest({ ...good, details: { units: "", leakFixed: "yes" } }, NOW);
    expect(ok.success && ok.data.details).toEqual({ leakFixed: "yes" });
    expect(parseRequest({ ...good, details: { leakFixed: "maybe" } }, NOW).success).toBe(false);
  });
  it("sorts property types", () => {
    expect(isOrg("manager")).toBe(true);
    expect(isOrg("homeowner")).toBe(false);
    expect(needsQuote("multifamily")).toBe(true);
    expect(needsQuote("condo")).toBe(false);
    expect(clientTypeLabel("manager")).toBe("Property manager");
  });
  it("lists only the answers that exist", () => {
    expect(intakeLines({ client_type: "manager", property_type: "condo", company: "Seaview HOA", intake: { canApprove: "yes", units: "3" } }))
      .toEqual([["Who", "Property manager"], ["Property", "Condo or townhome"], ["Company", "Seaview HOA"], ["Can approve and pay", "Yes"], ["Units or areas", "3"]]);
  });
});
