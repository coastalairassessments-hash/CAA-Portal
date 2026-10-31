import { describe, expect, it } from "vitest";
import { depositReminderText, linkText, missedCallText, reviewEmail, reviewText } from "./quicktexts";

describe("quick texts", () => {
  it("the link text sends the request page, with or without a trailing slash", () => {
    expect(linkText("https://book.example.com/")).toContain("https://book.example.com/request");
    expect(linkText("https://book.example.com")).toContain("nothing to pay to request");
  });
  it("the missed-call text points to the home page and invites a text back", () => {
    const t = missedCallText("https://book.example.com");
    expect(t).toContain("missed your call");
    expect(t).toContain("https://book.example.com.");
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
