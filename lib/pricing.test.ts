import { describe, expect, it } from "vitest";
import { depositCents, firstHourCents, formatMoney } from "./pricing";

describe("pricing", () => {
  it("first hour: PRV $575, everything else $685", () => {
    expect(firstHourCents("post_remediation")).toBe(57500);
    expect(firstHourCents("musty_smell")).toBe(68500);
    expect(firstHourCents("other")).toBe(68500);
  });
  it("deposit is 75% of the first hour", () => {
    expect(depositCents("musty_smell")).toBe(51375);
    expect(depositCents("post_remediation")).toBe(43125);
  });
  it("formats money", () => {
    expect(formatMoney(51375)).toBe("$513.75");
    expect(formatMoney(100000)).toBe("$1,000.00");
  });
});
