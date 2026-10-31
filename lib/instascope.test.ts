import { describe, expect, it } from "vitest";
import { INSTASCOPE_BODY, INSTASCOPE_EMAIL_LINE, INSTASCOPE_PRICE } from "./instascope";

describe("InstaScope copy", () => {
  it("states the price plainly and makes no medical or outcome promise", () => {
    expect(INSTASCOPE_PRICE).toMatch(/included in your hourly fee/);
    expect(INSTASCOPE_PRICE).toMatch(/no per-area charge/);
    expect(INSTASCOPE_EMAIL_LINE).toContain(INSTASCOPE_PRICE);
    expect(INSTASCOPE_BODY).not.toMatch(/guarantee|safe|toxic|demolition/i);
  });
});
