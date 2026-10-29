import { describe, expect, it } from "vitest";
import { buildIcs, easternToUtc } from "./ics";

describe("ics", () => {
  it("converts Eastern to UTC across daylight saving", () => {
    expect(easternToUtc("2026-11-03", "10:00").toISOString()).toBe("2026-11-03T15:00:00.000Z"); // EST
    expect(easternToUtc("2026-07-14", "12:30").toISOString()).toBe("2026-07-14T16:30:00.000Z"); // EDT
  });
  it("builds an event with the right length", () => {
    const s = buildIcs({ uid: "abc", date: "2026-11-03", time: "10:00", hours: 2, summary: "Visit", location: "1 Main, Stuart", description: "x", now: new Date("2026-10-29T00:00:00Z") });
    expect(s).toContain("DTSTART:20261103T150000Z");
    expect(s).toContain("DTEND:20261103T170000Z");
    expect(s).toContain("LOCATION:1 Main\\, Stuart");
  });
});
