import { describe, expect, it } from "vitest";
import { ZONES, classifyZip } from "./zones";

describe("classifyZip", () => {
  it("flags Stuart (Martin County) as core", () => {
    const r = classifyZip("34994");
    expect(r.area).toBe("core");
    expect(r.zoneId).toBe("martin");
  });

  it("flags Port St. Lucie as core", () => {
    expect(classifyZip("34986").zoneId).toBe("st-lucie");
  });

  it("flags West Palm Beach as core", () => {
    expect(classifyZip("33401").zoneId).toBe("palm-beach");
  });

  it("flags Miami as outside, silently", () => {
    const r = classifyZip("33101");
    expect(r.area).toBe("outside");
    expect(r.zoneId).toBeNull();
  });

  it("handles ZIP+4 and spaces", () => {
    expect(classifyZip(" 34994-1234 ").area).toBe("core");
  });

  it("supports a second service area added to the settings list", () => {
    const withSecond = [
      ...ZONES,
      { id: "second", name: "Second Area", zips: ["32801"] },
    ];
    expect(classifyZip("32801", withSecond).zoneId).toBe("second");
    expect(classifyZip("32801").area).toBe("outside");
  });

  it("has no ZIP listed in two zones", () => {
    const seen = new Set<string>();
    for (const z of ZONES) {
      for (const zip of z.zips) {
        expect(seen.has(zip)).toBe(false);
        seen.add(zip);
      }
    }
  });
});
