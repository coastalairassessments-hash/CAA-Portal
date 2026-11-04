import { describe, expect, it } from "vitest";
import { open, seal, sealingOn } from "./secretBox";

const KEY = Buffer.alloc(32, 7).toString("base64");
const OTHER = Buffer.alloc(32, 9).toString("base64");

describe("secretBox", () => {
  it("locks and unlocks", () => {
    const sealed = seal("refresh-token-123", { QB_TOKEN_KEY: KEY });
    expect(sealed.startsWith("enc1:")).toBe(true);
    expect(sealed).not.toContain("refresh-token-123");
    expect(open(sealed, { QB_TOKEN_KEY: KEY })).toBe("refresh-token-123");
  });
  it("makes a different lock each time", () => {
    expect(seal("x", { QB_TOKEN_KEY: KEY })).not.toBe(seal("x", { QB_TOKEN_KEY: KEY }));
  });
  it("refuses the wrong key and tampered data", () => {
    const sealed = seal("secret", { QB_TOKEN_KEY: KEY });
    expect(() => open(sealed, { QB_TOKEN_KEY: OTHER })).toThrow();
    const bytes = Buffer.from(sealed.slice(5), "base64");
    bytes[bytes.length - 1] ^= 1;
    expect(() => open("enc1:" + bytes.toString("base64"), { QB_TOKEN_KEY: KEY })).toThrow();
  });
  it("keeps working before a key is set", () => {
    expect(sealingOn({})).toBe(false);
    expect(seal("plain", {})).toBe("plain");
    expect(open("plain", {})).toBe("plain");
    expect(open("plain", { QB_TOKEN_KEY: KEY })).toBe("plain");
  });
  it("says so when locked data meets a missing key", () => {
    expect(() => open(seal("s", { QB_TOKEN_KEY: KEY }), {})).toThrow(/QB_TOKEN_KEY/);
  });
  it("rejects a key of the wrong size", () => {
    expect(() => seal("s", { QB_TOKEN_KEY: Buffer.alloc(8).toString("base64") })).toThrow(/32 bytes/);
  });
});
