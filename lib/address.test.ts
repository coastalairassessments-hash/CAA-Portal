import { describe, expect, it } from "vitest";
import { parseComponents, parseSuggestions } from "./address";

describe("parseSuggestions", () => {
  it("keeps id and text, drops broken rows, caps at five", () => {
    const rows = Array.from({ length: 7 }, (_, i) => ({ placePrediction: { placeId: `p${i}`, text: { text: `${i} Main St, Stuart, FL, USA` } } }));
    const out = parseSuggestions({ suggestions: [{ queryPrediction: {} }, ...rows] });
    expect(out).toHaveLength(5);
    expect(out[0]).toEqual({ id: "p0", text: "0 Main St, Stuart, FL, USA" });
  });
  it("is safe on nothing", () => {
    expect(parseSuggestions(undefined)).toEqual([]);
    expect(parseSuggestions({})).toEqual([]);
  });
});

describe("parseComponents", () => {
  const body = { addressComponents: [
    { longText: "3134", types: ["street_number"] },
    { longText: "Southeast Orangetree Place", types: ["route"] },
    { longText: "Stuart", types: ["locality", "political"] },
    { longText: "34997", types: ["postal_code"] },
  ] };
  it("builds the street, city and zip", () => {
    expect(parseComponents(body)).toEqual({ address: "3134 Southeast Orangetree Place", city: "Stuart", zip: "34997" });
  });
  it("adds a unit", () => {
    const withUnit = { addressComponents: [...body.addressComponents, { longText: "4B", types: ["subpremise"] }] };
    expect(parseComponents(withUnit)?.address).toBe("3134 Southeast Orangetree Place #4B");
  });
  it("gives nothing without a street", () => {
    expect(parseComponents({ addressComponents: [{ longText: "Stuart", types: ["locality"] }] })).toBeNull();
    expect(parseComponents(null)).toBeNull();
  });
});
