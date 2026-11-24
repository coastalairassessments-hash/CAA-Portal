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
  it("accepts a homeowner with a name and optional phone", () => {
    const h = { ...good, kind: "homeowner", newName: "Laura Baltadano", phone: "(772) 555-0142", email: "laura@example.com" };
    const r = parseContractorJob(h, NOW);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.kind).toBe("homeowner");
    expect(parseContractorJob({ ...h, phone: "" }, NOW).success).toBe(true);
  });
  it("rejects a homeowner with no name or a short phone", () => {
    expect(parseContractorJob({ ...good, kind: "homeowner", newName: "" }, NOW).success).toBe(false);
    expect(parseContractorJob({ ...good, kind: "homeowner", newName: "Laura B", phone: "555-01" }, NOW).success).toBe(false);
  });
  it("defaults to a contractor", () => {
    const r = parseContractorJob(good, NOW);
    if (r.success) expect(r.data.kind).toBe("contractor");
  });
});

describe("quarter-hour visits", () => {
  const base = { contractorId: "", newName: "Acme", service: "prv", address: "12 Main St", date: "2026-10-20", time: "10:00", outcome: "done", hours: "2.5" };
  it("accepts 1.5, 2.25 and 2.5 hours for a visit already done", () => {
    for (const h of ["0.25", "1.5", "2.25", "2.5", "8"]) expect(parseContractorJob({ ...base, hours: h }, NOW).success).toBe(true);
  });
  it("rejects odd fractions, zero and over 8", () => {
    for (const h of ["1.1", "0", "8.25"]) expect(parseContractorJob({ ...base, hours: h }, NOW).success).toBe(false);
  });
  it("still holds whole hours for a visit to come", () => {
    expect(parseContractorJob({ ...base, outcome: "", date: "2026-12-01", hours: "2.5" }, NOW).success).toBe(false);
    expect(parseContractorJob({ ...base, outcome: "", date: "2026-12-01", hours: "2" }, NOW).success).toBe(true);
  });
});
