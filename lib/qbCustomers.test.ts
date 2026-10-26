import { describe, expect, it } from "vitest";
import { customerQuery, mapCustomers, telDigits } from "./qbCustomers";

describe("customer search", () => {
  it("ignores tiny searches", () => {
    expect(customerQuery("a")).toBeNull();
    expect(customerQuery("  ")).toBeNull();
  });
  it("escapes quotes and strips wildcards", () => {
    const q = customerQuery("O'Brien %_");
    expect(q).toContain("O\\'Brien");
    expect(q).not.toContain("%_");
    expect(q).toContain("orderby DisplayName maxresults 15");
  });
  it("maps a QuickBooks customer to a client", () => {
    const [c] = mapCustomers({
      QueryResponse: { Customer: [{
        Id: "7", DisplayName: "Gulf Restoration", PrimaryPhone: { FreeFormNumber: "(772) 555-0100" },
        PrimaryEmailAddr: { Address: "a@b.com" },
        BillAddr: { Line1: "1 Main St", City: "Stuart", CountrySubDivisionCode: "FL", PostalCode: "34994" },
      }] },
    });
    expect(c).toEqual({ id: "7", name: "Gulf Restoration", phone: "(772) 555-0100", email: "a@b.com", address: "1 Main St, Stuart, FL 34994" });
  });
  it("handles an empty reply and sparse records", () => {
    expect(mapCustomers({})).toEqual([]);
    expect(mapCustomers({ QueryResponse: { Customer: [{ Id: "1", DisplayName: "Sam" }] } })[0]).toMatchObject({ name: "Sam", phone: "", address: "" });
  });
  it("cleans phone for tel links", () => {
    expect(telDigits("(772) 555-0100")).toBe("7725550100");
  });
});
