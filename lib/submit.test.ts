import { describe, expect, it, vi, type Mock } from "vitest";
import { MAX_PER_HOUR, submitRequest, type SubmitDeps } from "./submit";
import { buildAlert, sendEmailAlert } from "./notify";

const NOW = new Date("2026-10-25T17:00:00Z");

const good = {
  issue: "water_damage",
  sizeBand: "2000_4000",
  preferredDate: "2026-10-27",
  preferredTime: "12:30",
  name: "Pat Client",
  phone: "772-555-0142",
  email: "pat@example.com",
  address: "123 Ocean Blvd",
  city: "Stuart",
  zip: "34994",
  notes: "Smell in the guest room",
  textConsent: true,
  website: "",
};

type MockDeps = {
  ipSalt: string;
  now: () => Date;
  countRecentByIp: Mock<SubmitDeps["countRecentByIp"]>;
  insert: Mock<SubmitDeps["insert"]>;
  notify: Mock<SubmitDeps["notify"]>;
};

function makeDeps(overrides: Partial<MockDeps> = {}): MockDeps {
  return {
    ipSalt: "test-salt",
    now: () => NOW,
    countRecentByIp: vi.fn<SubmitDeps["countRecentByIp"]>(async () => 0),
    insert: vi.fn<SubmitDeps["insert"]>(async () => ({ id: "abc-123" })),
    notify: vi.fn<SubmitDeps["notify"]>(async () => {}),
    ...overrides,
  };
}

describe("submitRequest", () => {
  it("saves a good request, alerts Cory, and tells the client only 'ok'", async () => {
    const deps = makeDeps();
    const result = await submitRequest(good, "203.0.113.9", deps);
    expect(result).toEqual({ ok: true }); // nothing about area or zones leaks out
    expect(deps.insert).toHaveBeenCalledTimes(1);
    const row = (deps.insert.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(row.phone).toBe("+17725550142");
    expect(row.area).toBe("core");
    expect(row.zone_id).toBe("martin");
    expect(deps.notify).toHaveBeenCalledTimes(1);
  });

  it("flags an outside-area ZIP silently", async () => {
    const deps = makeDeps();
    const result = await submitRequest({ ...good, zip: "33101" }, "203.0.113.9", deps);
    expect(result).toEqual({ ok: true });
    const row = (deps.insert.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(row.area).toBe("outside");
    expect(row.zone_id).toBeNull();
  });

  it("stores a scrambled IP, never the raw one", async () => {
    const deps = makeDeps();
    await submitRequest(good, "203.0.113.9", deps);
    const row = (deps.insert.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(row.ip_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain("203.0.113.9");
  });

  it("quietly drops bot submissions (filled hidden field)", async () => {
    const deps = makeDeps();
    const result = await submitRequest({ ...good, website: "http://spam.example" }, "203.0.113.9", deps);
    expect(result).toEqual({ ok: true });
    expect(deps.insert).not.toHaveBeenCalled();
    expect(deps.notify).not.toHaveBeenCalled();
  });

  it("rejects bad input with field messages and saves nothing", async () => {
    const deps = makeDeps();
    const result = await submitRequest({ ...good, email: "nope", zip: "12" }, "203.0.113.9", deps);
    expect(result.ok).toBe(false);
    if (!result.ok && result.status === 400) {
      expect(Object.keys(result.errors)).toEqual(expect.arrayContaining(["email", "zip"]));
    }
    expect(deps.insert).not.toHaveBeenCalled();
  });

  it("rejects a body that is not an object", async () => {
    const deps = makeDeps();
    const result = await submitRequest("hello", null, deps);
    expect(result.ok).toBe(false);
    expect(deps.insert).not.toHaveBeenCalled();
  });

  it("slows down a device that sends too many requests", async () => {
    const deps = makeDeps({ countRecentByIp: vi.fn(async () => MAX_PER_HOUR) });
    const result = await submitRequest(good, "203.0.113.9", deps);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(429);
    expect(deps.insert).not.toHaveBeenCalled();
  });

  it("skips the spam limit when the device address is unknown, but still saves", async () => {
    const deps = makeDeps();
    const result = await submitRequest(good, null, deps);
    expect(result).toEqual({ ok: true });
    expect(deps.countRecentByIp).not.toHaveBeenCalled();
    const row = (deps.insert.mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(row.ip_hash).toBeNull();
  });

  it("returns a friendly error and sends no alert if saving fails", async () => {
    const deps = makeDeps({
      insert: vi.fn(async () => {
        throw new Error("db down");
      }),
    });
    const result = await submitRequest(good, "203.0.113.9", deps);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.status).toBe(500);
    expect(deps.notify).not.toHaveBeenCalled();
  });

  it("still succeeds if the email alert fails", async () => {
    const deps = makeDeps({
      notify: vi.fn(async () => {
        throw new Error("email down");
      }),
    });
    const result = await submitRequest(good, "203.0.113.9", deps);
    expect(result).toEqual({ ok: true });
  });
});

describe("alerts", () => {
  const row = {
    id: "abc-123",
    issue: "water_damage",
    size_band: "over_6000",
    preferred_date: "2026-10-27",
    preferred_time: "10:00",
    name: "Pat Client",
    phone: "+17725550142",
    email: "pat@example.com",
    address: "9 Far Away Rd",
    city: "Miami",
    zip: "33101",
    notes: "",
    text_consent: false,
    area: "outside" as const,
    zone_id: null,
    ip_hash: null,
  };

  it("marks outside-area requests for Cory in the subject", () => {
    const { subject, text } = buildAlert(row);
    expect(subject).toContain("OUTSIDE AREA");
    expect(text).toContain("no texting");
  });

  it("skips quietly when email keys are not set", async () => {
    const fetchMock = vi.fn();
    await sendEmailAlert(row, {}, fetchMock as unknown as typeof fetch);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends through Resend when keys are set", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    await sendEmailAlert(
      row,
      { RESEND_API_KEY: "k", ALERT_EMAIL: "me@example.com", ALERT_FROM: "portal@example.com" },
      fetchMock as unknown as typeof fetch,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
