import { describe, expect, it } from "vitest";
import { googleCalendarLink } from "./calendar";

const job = {
  name: "Pat Client",
  phone: "+17725550142",
  address: "123 5th St",
  city: "Stuart",
  zip: "34997",
  issue: "musty_smell",
  notes: "Gate code 1234",
};

describe("googleCalendarLink", () => {
  it("fills in title, Eastern time window, place and details", () => {
    const url = new URL(googleCalendarLink(job, { date: "2026-10-26", time: "10:00", hours: 2 }));
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("text")).toBe("CAA: Pat Client");
    expect(url.searchParams.get("dates")).toBe("20261026T100000/20261026T120000");
    expect(url.searchParams.get("ctz")).toBe("America/New_York");
    expect(url.searchParams.get("location")).toBe("123 5th St, Stuart FL 34997");
    expect(url.searchParams.get("details")).toContain("(772) 555-0142");
    expect(url.searchParams.get("details")).toContain("Gate code 1234");
  });
  it("rolls past midnight onto the next day", () => {
    const url = new URL(googleCalendarLink(job, { date: "2026-10-26", time: "22:00", hours: 4 }));
    expect(url.searchParams.get("dates")).toBe("20261026T220000/20261027T020000");
  });
});
