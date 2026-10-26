import { describe, expect, it, vi } from "vitest";
import { confirmEmail, confirmText, declineEmail, offerEmail, offerText, parseConfirm, smsLink, takenEmail } from "./confirm";
import { sendEmail } from "./notify";

const NOW = new Date("2026-10-25T17:00:00Z");
const id = "11111111-1111-4111-8111-111111111111";
const row = { name: "Pat Client", phone: "+17725550142", address: "123 Ocean Blvd", city: "Stuart", zip: "34994" };

describe("parseConfirm", () => {
  it("accepts a good booking", () => {
    const r = parseConfirm({ id, date: "2026-10-27", time: "10:00", hours: "2" }, NOW);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.hours).toBe(2);
  });
  it("rejects past dates, bad times and odd hours", () => {
    expect(parseConfirm({ id, date: "2026-10-20", time: "10:00", hours: "2" }, NOW).success).toBe(false);
    expect(parseConfirm({ id, date: "2026-10-27", time: "25:00", hours: "2" }, NOW).success).toBe(false);
    expect(parseConfirm({ id, date: "2026-10-27", time: "10:00", hours: "0" }, NOW).success).toBe(false);
    expect(parseConfirm({ id, date: "2026-10-27", time: "10:00", hours: "9" }, NOW).success).toBe(false);
    expect(parseConfirm({ id: "nope", date: "2026-10-27", time: "10:00", hours: "2" }, NOW).success).toBe(false);
  });
});

describe("messages", () => {
  const b = { date: "2026-10-27", time: "12:30", hours: 2 };
  it("confirmation email has the date, time, place and length", () => {
    const { subject, text } = confirmEmail(row, b);
    expect(subject).toContain("Tue, Oct 27");
    expect(subject).toContain("12:30 PM");
    expect(text).toContain("123 Ocean Blvd");
    expect(text).toContain("2 hours");
    expect(text).toContain("Hi Pat");
    expect(confirmEmail(row, b, "https://x.test/").text).toContain("https://x.test/terms");
  });
  it("offer email states the deposit and that the first deposit holds the date", () => {
    const { subject, text } = offerEmail(row, b, 51375);
    expect(subject).toContain("12:30 PM");
    expect(text).toContain("$513.75");
    expect(text).toContain("first deposit holds it");
    expect(text).toContain("one-hour minimum");
    expect(offerText(row, b, 51375)).toContain("$513.75");
  });
  it("taken email names the lost time and asks for another day", () => {
    const { text } = takenEmail(row, b);
    expect(text).toContain("Tue, Oct 27");
    expect(text).toContain("another day");
  });
  it("confirmation says the deposit was received", () => {
    expect(confirmEmail(row, b).text).toContain("received your deposit");
  });
  it("decline email is polite and short", () => {
    expect(declineEmail(row).text).toContain("Hi Pat");
  });
  it("text link opens Messages with the body encoded", () => {
    const link = smsLink(row.phone, confirmText(row, b));
    expect(link.startsWith("sms:+17725550142&body=")).toBe(true);
    expect(link).not.toContain(" ");
  });
});

describe("sendEmail", () => {
  const msg = { to: "pat@example.com", subject: "s", text: "t" };
  it("says so when email is not set up", async () => {
    expect(await sendEmail(msg, {})).toEqual({ ok: false, reason: "email-not-set-up" });
  });
  it("sends with reply-to and reports success", async () => {
    const f = vi.fn(async () => new Response("{}", { status: 200 }));
    const r = await sendEmail(msg, { RESEND_API_KEY: "k", ALERT_FROM: "a@x.com", ALERT_EMAIL: "me@x.com" }, f as unknown as typeof fetch);
    expect(r).toEqual({ ok: true });
    const body = JSON.parse((f.mock.calls[0] as unknown as [string, { body: string }])[1].body);
    expect(body.reply_to).toBe("me@x.com");
    expect(body.to).toEqual(["pat@example.com"]);
  });
  it("reports a refusal code without throwing", async () => {
    const f = vi.fn(async () => new Response("{}", { status: 403 }));
    const r = await sendEmail(msg, { RESEND_API_KEY: "k", ALERT_FROM: "a@x.com" }, f as unknown as typeof fetch);
    expect(r).toEqual({ ok: false, reason: "resend-403" });
  });
  it("reports a network failure without throwing", async () => {
    const f = vi.fn(async () => { throw new Error("down"); });
    const r = await sendEmail(msg, { RESEND_API_KEY: "k", ALERT_FROM: "a@x.com" }, f as unknown as typeof fetch);
    expect(r).toEqual({ ok: false, reason: "network" });
  });
});
