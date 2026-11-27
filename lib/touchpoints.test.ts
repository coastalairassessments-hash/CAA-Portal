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

import { arrivalClock, onMyWayEtaText } from "./eta";
describe("on my way with an arrival time", () => {
  const now = new Date("2026-11-27T14:15:00Z"); // 9:15 AM Eastern
  it("adds the minutes to the clock in Eastern time", () => {
    expect(arrivalClock(now, 30)).toBe("9:45 AM");
    expect(arrivalClock(now, 60)).toBe("10:15 AM");
  });
  it("writes the text with the arrival time and the live link", () => {
    const t = onMyWayEtaText({ name: "Pat Lee" }, 30, now, "https://x.com/booking/abc");
    expect(t).toContain("about 30 minutes out, arriving around 9:45 AM");
    expect(t).toContain("https://x.com/booking/abc");
  });
});

import { needsThanks, normalizePhone, thankReferrerText } from "./referrals";
import { referrersToThank, type DashRow } from "./dashboard";
describe("referral thank-you", () => {
  it("cleans phone numbers to digits with the US code, and refuses junk", () => {
    expect(normalizePhone("(772) 555-0100")).toBe("17725550100");
    expect(normalizePhone("1 772 555 0100")).toBe("17725550100");
    expect(normalizePhone("12345")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });
  it("thanks the partner without naming the client", () => {
    const t = thankReferrerText("Jane Smith, Coastal Realty");
    expect(t).toContain("Hi Jane");
    expect(t).toContain("Thank you for sending someone our way");
  });
  it("is owed only for a paid, referred job not yet thanked", () => {
    const paid = "2026-11-20T00:00:00Z";
    expect(needsThanks({ referral_code: "jane", final_paid_at: paid })).toBe(true);
    expect(needsThanks({ referral_code: "jane", final_paid_at: paid, referral_thanked_at: paid })).toBe(false);
    expect(needsThanks({ referral_code: "jane", final_paid_at: null })).toBe(false);
    expect(needsThanks({ referral_code: null, final_paid_at: paid })).toBe(false);
  });
  it("counts them for the Home screen", () => {
    const rows = [{ referral_code: "a", final_paid_at: "x" }, { referral_code: "b", final_paid_at: "x", referral_thanked_at: "y" }, { referral_code: null, final_paid_at: "x" }] as unknown as DashRow[];
    expect(referrersToThank(rows)).toBe(1);
  });
});
