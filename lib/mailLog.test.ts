import { describe, expect, it, vi } from "vitest";

vi.mock("./notify", () => ({ sendEmail: vi.fn() }));
import { sendEmail } from "./notify";
import { sendLogged } from "./mailLog";

function fakeDb() {
  const calls: unknown[] = [];
  const db = { from: () => ({ update: (v: unknown) => { calls.push(v); return { eq: async () => ({ error: null }) }; } }) };
  return { db: db as never, calls };
}

describe("sendLogged", () => {
  it("leaves the job alone when the email goes out", async () => {
    vi.mocked(sendEmail).mockResolvedValue({ ok: true });
    const { db, calls } = fakeDb();
    expect(await sendLogged(db, "1", { to: "a@b.c", subject: "s", text: "t" })).toEqual({ ok: true });
    expect(calls).toHaveLength(0);
  });
  it("marks the job when it fails, and does not throw", async () => {
    vi.mocked(sendEmail).mockResolvedValue({ ok: false, reason: "resend-403" });
    const { db, calls } = fakeDb();
    const res = await sendLogged(db, "1", { to: "a@b.c", subject: "s", text: "t" });
    expect(res).toEqual({ ok: false, reason: "resend-403" });
    expect(calls[0]).toMatchObject({ email_failed_reason: "resend-403" });
  });
});
