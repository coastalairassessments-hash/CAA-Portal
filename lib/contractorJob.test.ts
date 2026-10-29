import { describe, expect, it } from "vitest";
import { issueForService, parseContractorJob } from "./contractorJob";

const NOW = new Date("2026-10-26T14:00:00Z");
const good = { contractorId: "", newName: "Gulf Coast Restoration", service: "prv", address: "88 Indian St, Jensen Beach", date: "2026-10-28", time: "12:30", hours: "3" };

describe("parseContractorJob", () => {
  it("accepts a new contractor with a job", () => {
    const r = parseContractorJob(good, NOW);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.hours).toBe(3);
  });
  it("accepts an existing contractor", () => {
    expect(parseContractorJob({ ...good, newName: "", contractorId: "11111111-1111-4111-8111-111111111111" }, NOW).success).toBe(true);
  });
  it("needs a contractor", () => {
    expect(parseContractorJob({ ...good, newName: "" }, NOW).success).toBe(false);
  });
  it("the latest start is 1:00 PM", () => {
    expect(parseContractorJob({ ...good, time: "13:00" }, NOW).success).toBe(true);
    expect(parseContractorJob({ ...good, time: "13:15" }, NOW).success).toBe(false);
  });
  it("rejects bad address, date, time and hours", () => {
    expect(parseContractorJob({ ...good, address: "x" }, NOW).success).toBe(false);
    expect(parseContractorJob({ ...good, date: "2026-10-20" }, NOW).success).toBe(false);
    expect(parseContractorJob({ ...good, time: "25:00" }, NOW).success).toBe(false);
    expect(parseContractorJob({ ...good, hours: "0" }, NOW).success).toBe(false);
    expect(parseContractorJob({ ...good, service: "other" }, NOW).success).toBe(false);
  });
  it("maps services to the price tier", () => {
    expect(issueForService("prv")).toBe("post_remediation");
    expect(issueForService("assessment")).toBe("air_quality");
  });
});
