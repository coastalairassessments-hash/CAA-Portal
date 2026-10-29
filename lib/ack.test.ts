import { describe, expect, it } from "vitest";
import { receivedEmail } from "./ack";

describe("receivedEmail", () => {
  it("says what happens next", () => {
    const m = receivedEmail({ name: "Pat Lee", issue: "musty_smell", preferred_date: "2026-11-03", preferred_time: "10:00" });
    expect(m.text).toContain("Hi Pat,");
    expect(m.text).toContain("nothing to pay today");
    expect(m.text).toContain("first deposit gets it");
  });
});
