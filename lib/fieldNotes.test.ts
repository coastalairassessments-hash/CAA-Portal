import { describe, expect, it } from "vitest";
import { MAX_PHOTO_BYTES, clientPhotoPath, isClientPhoto, parseNote, parseRowId, parseSample, photoPath, sampleNote, validPhotoPath } from "./fieldNotes";

const ID = "11111111-1111-4111-8111-111111111111";

describe("field notes", () => {
  it("needs some text in a note", () => {
    expect(parseNote({ id: ID, body: "   " }).success).toBe(false);
    expect(parseNote({ id: ID, body: "Moisture 24% behind the sink" }).success).toBe(true);
  });
  it("trims and cleans a sample", () => {
    const r = parseSample({ id: ID, label: " A1 ", location: "", kind: "air", lab_ref: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toMatchObject({ label: "A1", location: null, lab_ref: null });
  });
  it("rejects an unknown sample kind and a missing label", () => {
    expect(parseSample({ id: ID, label: "A1", kind: "soil" }).success).toBe(false);
    expect(parseSample({ id: ID, label: "", kind: "air" }).success).toBe(false);
  });
  it("needs real ids to delete a row", () => {
    expect(parseRowId({ id: ID, row: "nope" }).success).toBe(false);
    expect(parseRowId({ id: ID, row: ID }).success).toBe(true);
  });
  it("builds photo paths that stay inside the job folder", () => {
    const p = photoPath(ID, 1700000000000, 0.5);
    expect(p.startsWith(`${ID}/`)).toBe(true);
    expect(validPhotoPath(ID, p)).toBe(true);
    expect(validPhotoPath(ID, `${ID}/../other.jpg`)).toBe(false);
    expect(validPhotoPath(ID, "22222222-2222-4222-8222-222222222222/1-a.jpg")).toBe(false);
  });
  it("keeps photos small", () => {
    expect(MAX_PHOTO_BYTES).toBeLessThan(2_000_000);
  });
  it("tells the logged count apart from the invoice count", () => {
    expect(sampleNote(0, null)).toBeNull();
    expect(sampleNote(3, 3)).toBe("3 logged, matches the invoice.");
    expect(sampleNote(3, 2)).toBe("3 logged, invoice says 2.");
    expect(sampleNote(2, null)).toBe("2 logged. Invoice samples not set yet.");
  });
});

describe("client photos", () => {
  const id = "11111111-1111-1111-1111-111111111111";
  it("are told apart from Cory's and still valid", () => {
    expect(isClientPhoto(clientPhotoPath(id, 5, 0.5))).toBe(true);
    expect(isClientPhoto(photoPath(id, 5, 0.5))).toBe(false);
    expect(validPhotoPath(id, clientPhotoPath(id))).toBe(true);
    expect(validPhotoPath(id, `${id}/x.jpg`)).toBe(false);
  });
});
