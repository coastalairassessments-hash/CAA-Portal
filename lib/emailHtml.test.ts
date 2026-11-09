import { describe, expect, it } from "vitest";
import { textToHtml } from "./emailHtml";

describe("textToHtml", () => {
  it("makes the booking page a button", () => {
    const h = textToHtml("Hi Pat,\n\nYour booking, any time: https://book.coastalairassessments.com/booking/abc\n\nThanks");
    expect(h).toContain('<a href="https://book.coastalairassessments.com/booking/abc"');
    expect(h).toContain("Open your booking page");
  });
  it("links other addresses and drops a trailing full stop", () => {
    const h = textToHtml("Terms: see https://x.test/terms.");
    expect(h).toContain('href="https://x.test/terms"');
    expect(h).toContain("</a>.");
  });
  it("escapes anything that looks like markup", () => {
    expect(textToHtml("<b>hi</b> & bye")).toContain("&lt;b&gt;hi&lt;/b&gt; &amp; bye");
  });
});
