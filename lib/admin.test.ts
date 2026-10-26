import { describe, expect, it } from "vitest";
import { counts, filterRows, mapsLink, parseTab, todayLabel, type AdminRow } from "./admin";

const base: AdminRow = {
  id: "1", created_at: "", status: "new", issue: "musty_smell", size_band: "under_2000",
  preferred_date: "2026-10-27", preferred_time: "10:00", name: "A", phone: "+17725550142",
  email: "a@x.com", address: "1 Main St", city: "Stuart", zip: "34994", notes: "",
  text_consent: true, confirmed_date: null, confirmed_time: null, block_hours: null, area: "core", source: "client",
};
const rows: AdminRow[] = [
  { ...base, id: "n1" },
  { ...base, id: "n2", area: "outside" },
  { ...base, id: "b2", status: "confirmed", confirmed_date: "2026-10-29", confirmed_time: "10:00" },
  { ...base, id: "b1", status: "confirmed", confirmed_date: "2026-10-27", confirmed_time: "12:30" },
  { ...base, id: "old", status: "confirmed", confirmed_date: "2026-10-01", confirmed_time: "10:00" },
  { ...base, id: "d1", status: "declined" },
  { ...base, id: "w1", status: "offered", confirmed_date: "2026-10-30", confirmed_time: "10:00" },
];

describe("admin helpers", () => {
  it("defaults to the Requests tab for anything unknown", () => {
    expect(parseTab(undefined)).toBe("requests");
    expect(parseTab("nope")).toBe("requests");
    expect(parseTab("new")).toBe("requests");
    expect(parseTab("booked")).toBe("booked");
    expect(parseTab(["declined"])).toBe("declined");
  });
  it("filters by tab and sorts booked soonest first", () => {
    expect(filterRows(rows, "requests").map((r) => r.id)).toEqual(["n1", "n2", "w1"]);
    expect(filterRows(rows, "booked").map((r) => r.id)).toEqual(["old", "b1", "b2"]);
    expect(filterRows(rows, "declined").map((r) => r.id)).toEqual(["d1"]);
    expect(filterRows(rows, "all")).toHaveLength(7);
  });
  it("counts new, upcoming booked, and outside-area new", () => {
    expect(counts(rows, "2026-10-26")).toEqual({ new: 2, waiting: 1, upcoming: 2, outside: 1 });
  });
  it("builds a maps link", () => {
    expect(mapsLink(base)).toBe("https://maps.apple.com/?daddr=1%20Main%20St%2C%20Stuart%20FL%2034994");
  });
  it("maps link works with just an address", () => {
    expect(mapsLink({ address: "88 Indian St, Jensen Beach" })).toBe("https://maps.apple.com/?daddr=88%20Indian%20St%2C%20Jensen%20Beach");
  });
  it("labels today in Eastern time", () => {
    expect(todayLabel(new Date("2026-10-26T03:00:00Z"))).toBe("Sunday, Oct 25");
  });
});
