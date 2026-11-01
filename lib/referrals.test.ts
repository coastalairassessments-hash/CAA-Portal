import { describe, expect, it } from "vitest";
import { makeCode, parsePartner, parseRefCode, referralLink, tally } from "./referrals";

describe("makeCode", () => {
  it("makes a clean slug", () => expect(makeCode("Jane Smith, Realtor", [])).toBe("jane-smith-realtor"));
  it("avoids a taken code", () => expect(makeCode("Jane Smith", ["jane-smith"])).toBe("jane-smith-2"));
  it("handles odd input", () => {
    expect(makeCode("!!", [])).toBe("partner");
    expect(parseRefCode(makeCode("Zoë & Co.", []))).not.toBeNull();
  });
});
describe("parseRefCode", () => {
  it("accepts good codes and lowercases", () => expect(parseRefCode(" Jane-Smith ")).toBe("jane-smith"));
  it("rejects junk", () => {
    expect(parseRefCode("a")).toBeNull();
    expect(parseRefCode("x y")).toBeNull();
    expect(parseRefCode("<script>")).toBeNull();
    expect(parseRefCode(null)).toBeNull();
  });
});
describe("parsePartner", () => {
  it("needs a name and a kind", () => {
    expect(parsePartner({ name: "Jane", kind: "realtor" }).success).toBe(true);
    expect(parsePartner({ name: "J", kind: "realtor" }).success).toBe(false);
    expect(parsePartner({ name: "Jane", kind: "alien" }).success).toBe(false);
  });
});
describe("referralLink", () => {
  it("builds the booking link", () => expect(referralLink("jane", "https://x.test/")).toBe("https://x.test/request?ref=jane"));
});
describe("tally", () => {
  it("counts jobs and paid, busiest first", () => {
    const partners = [
      { code: "a", name: "A", kind: "realtor" },
      { code: "b", name: "B", kind: "plumber" },
    ];
    const out = tally(partners, [
      { referral_code: "b", final_paid_at: "x" },
      { referral_code: "b" },
      { referral_code: "a" },
      { referral_code: "gone" },
      {},
    ]);
    expect(out.map((s) => [s.code, s.jobs, s.paid])).toEqual([["b", 2, 1], ["a", 1, 0]]);
  });
});
