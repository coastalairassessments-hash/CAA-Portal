import { describe, expect, it } from "vitest";
import { cleanEmail, cleanPhone, mapClients, parseCsv } from "./clientImport";

describe("client import", () => {
  it("reads quoted commas and lines", () => {
    expect(parseCsv('a,b\n"x, y","l1\nl2"\n')).toEqual([["a", "b"], ["x, y", "l1\nl2"]]);
  });
  it("cleans phones and emails", () => {
    expect(cleanPhone("561-301-9608 - Audrey")).toEqual({ phone: "(561) 301-9608", digits: "5613019608" });
    expect(cleanPhone("none")).toBeNull();
    expect(cleanEmail("A@B.com, c@d.com")).toBe("a@b.com");
  });
  it("maps a Jobber row and skips archived and duplicates", () => {
    const csv = ["Display Name,Main Phone #s,E-mails,Service Street 1,Service City,Service State,Service Zip code,Archived",
      "Adrian Lopez,(561) 503-9518,A@x.com,300 Cavalier Road,Palm Springs,FL,33461,false",
      "Adrian Lopez,,a@x.com,,,,,false",
      "Old Client,,,,,,,true"].join("\n");
    const rows = mapClients(csv, "jobber");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: "Adrian Lopez", email: "a@x.com", phone_digits: "5615039518", address: "300 Cavalier Road, Palm Springs, FL 33461" });
  });
});
