import { describe, expect, it } from "vitest";
import { feedbackUrl, sendsToGoogle, validRating } from "./feedback";
import { depositNudgeDue, depositNudgeEmail, type NudgeRow } from "./depositNudge";
import { visitSummaryEmail } from "./visitSummary";
import { reviewEmail, reviewText } from "./quicktexts";

describe("feedback first", () => {
  it("accepts only whole ratings 1 to 5", () => {
    expect([1, 2, 3, 4, 5].every(validRating)).toBe(true);
    expect([0, 6, 2.5, NaN, "x", null].some(validRating)).toBe(false);
  });
  it("sends 4 and 5 to Google, keeps 1 to 3 private", () => {
    expect([1, 2, 3].map(sendsToGoogle)).toEqual([false, false, false]);
    expect([4, 5].map(sendsToGoogle)).toEqual([true, true]);
  });
  it("builds the link from the private token", () => {
    expect(feedbackUrl({ public_token: "a".repeat(32) }, "https://x.com/")).toBe(`https://x.com/booking/${"a".repeat(32)}/feedback`);
    expect(feedbackUrl({}, "https://x.com")).toBeNull();
  });
  it("review emails and texts ask for the rating before the Google link", () => {
    const row = { name: "Pat Lee", public_token: "b".repeat(32) };
    const e = reviewEmail(row, "https://g.page/r/abc", "https://x.com").text;
    expect(e).toContain("/feedback");
    expect(e).not.toContain("g.page");
    expect(reviewText(row, "https://g.page/r/abc", "https://x.com/f")).not.toContain("g.page");
    expect(reviewText(row, "https://g.page/r/abc")).toContain("g.page");
  });
});

describe("deposit nudge", () => {
  const row: NudgeRow = { status: "offered", booking_mode: "manual", offered_at: "2026-11-01T12:00:00Z", email: "a@b.com", qb_deposit_invoice_id: "cs_1", confirmed_date: "2026-11-10", confirmed_time: "10:00" };
  const at = (h: number) => new Date(new Date(row.offered_at!).getTime() + h * 3_600_000);
  it("waits a full day", () => {
    expect(depositNudgeDue(row, at(23))).toBe(false);
    expect(depositNudgeDue(row, at(24))).toBe(true);
  });
  it("is sent once", () => expect(depositNudgeDue({ ...row, deposit_reminded_at: "2026-11-02T12:00:00Z" }, at(48))).toBe(false));
  it("skips instant holds, paid bookings and rows with no email or link", () => {
    expect(depositNudgeDue({ ...row, booking_mode: "instant" }, at(48))).toBe(false);
    expect(depositNudgeDue({ ...row, status: "confirmed" }, at(48))).toBe(false);
    expect(depositNudgeDue({ ...row, email: null }, at(48))).toBe(false);
    expect(depositNudgeDue({ ...row, qb_deposit_invoice_id: null }, at(48))).toBe(false);
  });
  it("says nothing is scheduled until the deposit arrives, with no pressure", () => {
    const t = depositNudgeEmail({ name: "Pat Lee", public_token: "c".repeat(32), confirmed_date: "2026-11-10", confirmed_time: "10:00" }, "https://x.com").text;
    expect(t).toContain("not on our schedule yet");
    expect(t).toContain("scheduled once your deposit is received");
    expect(t).not.toContain("offered you");
    expect(t).toContain("/booking/");
  });
});

describe("visit summary email", () => {
  it("carries Cory's note and the next steps", () => {
    const t = visitSummaryEmail({ name: "Pat Lee", public_token: "d".repeat(32) }, "Moisture behind the tub wall.", "https://x.com").text;
    expect(t).toContain("Moisture behind the tub wall.");
    expect(t).toContain("final invoice");
    expect(t).toContain("report is released once the final invoice is paid");
  });
});
