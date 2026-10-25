import { describe, expect, it } from "vitest";
import { formatPhone, formatTime, issueLabel, sizeLabel } from "./labels";

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
});
