import { describe, expect, it } from "vitest";
import { formatPhone, formatStamp, formatTime, issueLabel, sizeLabel } from "./labels";

describe("labels", () => {
  it("formats phones and falls back to the raw value", () => {
    expect(formatPhone("+17725550142")).toBe("(772) 555-0142");
    expect(formatPhone("abc")).toBe("abc");
  });
  it("formats times", () => {
    expect(formatTime("10:00")).toBe("10:00 AM");
    expect(formatTime("12:30:00")).toBe("12:30 PM");
  });
  it("labels issues and sizes, unknown values pass through", () => {
    expect(issueLabel("water_damage")).toBe("Water damage");
    expect(sizeLabel("over_6000")).toBe("Over 6,000 sq ft");
    expect(issueLabel("new_thing")).toBe("new_thing");
  });
  it("formats a timestamp in Eastern time", () => {
    expect(formatStamp("2026-10-26T23:41:00Z")).toBe("Oct 26 at 7:41 PM");
  });
});

import { fullAddress, jobLabel } from "./labels";
describe("address and job labels", () => {
  it("joins what exists", () => {
    expect(fullAddress({ address: "123 5th St", city: "Stuart", zip: "34997" })).toBe("123 5th St, Stuart 34997");
    expect(fullAddress({ address: "88 Indian St, Jensen Beach", city: null, zip: null })).toBe("88 Indian St, Jensen Beach");
  });
  it("names contractor jobs by service", () => {
    expect(jobLabel({ issue: "post_remediation", source: "contractor" })).toContain("PRV");
    expect(jobLabel({ issue: "air_quality", source: "contractor" })).toBe("Mold and air quality assessment");
    expect(jobLabel({ issue: "musty_smell", source: "client" })).toBe("Musty smell");
  });
});
