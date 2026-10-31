import { describe, expect, it } from "vitest";
import { QbReconnectError, connectionExpired } from "./qbStore";

describe("quickbooks connection health", () => {
  it("is expired once the refresh token date has passed", () => {
    expect(connectionExpired({ refresh_expires_at: "2026-01-01T00:00:00Z" }, Date.parse("2026-02-01T00:00:00Z"))).toBe(true);
    expect(connectionExpired({ refresh_expires_at: "2026-03-01T00:00:00Z" }, Date.parse("2026-02-01T00:00:00Z"))).toBe(false);
  });
  it("has a reconnect error the app can recognise", () => {
    const e = new QbReconnectError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("QbReconnectError");
  });
});
