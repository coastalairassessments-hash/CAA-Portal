import { z } from "zod";

export const SAMPLE_KINDS = [
  { value: "air", label: "Air" },
  { value: "surface", label: "Surface" },
  { value: "bulk", label: "Bulk" },
  { value: "water", label: "Water" },
  { value: "other", label: "Other" },
] as const;

const id = z.string().uuid("Missing job");
const text = (max: number) => z.string().trim().max(max);

export const parseNote = (input: unknown) =>
  z.object({ id, body: text(4000).min(1, "Write a note first") }).safeParse(input);

export const parseSample = (input: unknown) =>
  z
    .object({
      id,
      label: text(80).min(1, "Give the sample a label"),
      location: text(200).optional().transform((v) => v || null),
      kind: z.enum(["air", "surface", "bulk", "water", "other"]),
      lab_ref: text(80).optional().transform((v) => v || null),
    })
    .safeParse(input);

export const parseRowId = (input: unknown) => z.object({ id, row: z.string().uuid() }).safeParse(input);

// Photos are shrunk on the phone first, so a real one is far under this.
export const MAX_PHOTO_BYTES = 1_500_000;

export function photoPath(requestId: string, now = Date.now(), rand = Math.random()): string {
  return `${requestId}/${now}-${Math.floor(rand * 1e9).toString(36)}.jpg`;
}

export function validPhotoPath(requestId: string, path: string): boolean {
  return new RegExp(`^${requestId}/[0-9]+-[0-9a-z]+\\.jpg$`).test(path);
}

// Samples written down versus samples on the invoice: shown so a mismatch is noticed, never changed silently.
export function sampleNote(logged: number, billed: number | null): string | null {
  if (logged === 0 && !billed) return null;
  if (billed === null || billed === undefined) return `${logged} logged. Invoice samples not set yet.`;
  return logged === billed ? `${logged} logged, matches the invoice.` : `${logged} logged, invoice says ${billed}.`;
}
