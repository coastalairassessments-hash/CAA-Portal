import { describe, expect, it } from "vitest";
import { DEPOSIT_RATE, depositCents, firstHourCents } from "./pricing";
import { QUARTER_HOUR_CENTS, SAMPLE_CENTS } from "./billing";
import { POLICY_SECTIONS } from "./policy";
import { REFUND_WINDOW_HOURS } from "./cancel";
import { offerEmail } from "./confirm";
import { issueLabel, jobLabel } from "./labels";

// One set of numbers must tell the same story everywhere: policy page, emails, math.
describe("coherence", () => {
  const policy = JSON.stringify(POLICY_SECTIONS);
  it("policy quotes the same rates the app bills", () => {
    expect(QUARTER_HOUR_CENTS * 4).toBe(19500);
    expect(policy).toContain("$195");
    expect(SAMPLE_CENTS).toBe(8500);
    expect(policy).toContain("$85");
    expect(DEPOSIT_RATE).toBe(0.75);
    expect(policy).toContain("75%");
    expect(policy).toContain(`${REFUND_WINDOW_HOURS} hours`);
  });
  it("the offer email states the deposit the app records", () => {
    const row = { name: "Pat", phone: "+17725550142", address: "1 Main", city: "Stuart", zip: "34994" };
    const text = offerEmail(row, { date: "2026-10-27", time: "10:00", hours: 2 }, depositCents("musty_smell")).text;
    expect(text).toContain("$513.75");
    expect(firstHourCents("musty_smell")).toBe(68500);
  });
  it("PRV has one name everywhere", () => {
    expect(issueLabel("post_remediation")).toBe(jobLabel({ issue: "post_remediation", source: "contractor" }));
  });
});
