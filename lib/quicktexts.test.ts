import { describe, expect, it } from "vitest";
import { afterHoursText, depositReminderText, linkText, missedCallText, reviewEmail, reviewText } from "./quicktexts";

describe("quick texts", () => {
  it("the link texts send people to the site, not straight into a booking", () => {
    for (const make of [linkText, missedCallText, afterHoursText]) {
      const t = make("https://book.example.com/");
      expect(t.endsWith("https://book.example.com")).toBe(true);
      expect(t).not.toContain("/request");
      expect(t).toMatch(/pricing and open days/);
    }
  });
  it("makes no promise about price, refunds or timing", () => {
    for (const make of [linkText, missedCallText, afterHoursText]) {
      expect(make("https://x.com")).not.toMatch(/refund|nothing to pay|minutes|next business day|guarantee/i);
    }
  });
  it("each text says what moment it is for", () => {
    expect(linkText("https://x.com")).toContain("Good talking with you");
    expect(missedCallText("https://x.com")).toContain("missed your call");
    expect(afterHoursText("https://x.com")).toContain("away from the phone");
  });
  it("the deposit reminder names the deposit and the date", () => {
    const t = depositReminderText({ name: "Pat Client" }, "Tue, Oct 27 at 10:00 AM", "$513.75");
    expect(t).toContain("Hi Pat");
    expect(t).toContain("$513.75");
    expect(t).toContain("Tue, Oct 27");
  });
  it("review messages carry the link", () => {
    expect(reviewText({ name: "Pat" }, "https://g.page/r/abc")).toContain("https://g.page/r/abc");
    expect(reviewEmail({ name: "Pat" }, "https://g.page/r/abc").text).toContain("https://g.page/r/abc");
  });
});

describe("reviewEmail book again", () => {
  it("adds the prefilled link only when it can", () => {
    const withLink = reviewEmail({ name: "Pat", public_token: "a".repeat(32) }, "https://g.page/r/abc", "https://caaportal.netlify.app/");
    expect(withLink.text).toContain(`https://caaportal.netlify.app/request?again=${"a".repeat(32)}`);
    expect(reviewEmail({ name: "Pat" }, "https://g.page/r/abc", "https://x.com").text).not.toContain("again");
  });
});
