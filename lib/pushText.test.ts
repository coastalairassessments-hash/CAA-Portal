import { describe, expect, it } from "vitest";
import { briefingPush, newRequestPush } from "./pushText";
import { buildBriefing } from "./briefing";

describe("pushText", () => {
  it("words a new request", () => {
    const m = newRequestPush({ id: "x", issue: "musty_smell", city: "Stuart", preferred_date: "2026-11-03", preferred_time: "10:00" });
    expect(m.body).toContain("Musty smell, Stuart");
    expect(m.url).toBe("/admin/x");
  });
  it("turns a briefing into a short alert", () => {
    const b = buildBriefing("today", "2026-11-03", [{ confirmed_time: "10:00", name: "A", issue: "musty_smell", address: "1 Main", city: "Stuart", block_hours: 1 }], { approve: 1, deposits: 0, toInvoice: 1, refunds: 0 });
    const p = briefingPush(b.subject, b.text);
    expect(p.title).toBe("Today: 1 inspection, first at 10:00 AM");
    expect(p.body).toBe("1 new request to approve, 1 final invoice to send");
  });
});

import { abandonedPush } from "./pushText";
describe("abandonedPush", () => {
  it("names the client and the time and opens the job", () => {
    const m = abandonedPush({ name: "Pat Lee", id: "abc" }, "Tue, Nov 3 at 10:00 AM");
    expect(m.title).toBe("Left without paying");
    expect(m.body).toContain("Pat Lee");
    expect(m.url).toBe("/admin/abc");
  });
});
