// Materials and fees on a job: lab samples, a trip fee, or anything else. Pure.
import { z } from "zod";
import { SAMPLE_CENTS } from "./billing";

export const TRIP_FEE_CENTS = 35000;

export type Charge = { id: string; kind: "material" | "trip" | "other"; description: string; qty: number; unit_cents: number };

export const chargeCents = (c: Pick<Charge, "qty" | "unit_cents">) => Math.round(Number(c.qty) * c.unit_cents);
export const sumCharges = (cs: Pick<Charge, "qty" | "unit_cents">[]) => cs.reduce((t, c) => t + chargeCents(c), 0);

const dollars = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    const n = Number(v.replace(/[$,]/g, ""));
    if (!Number.isFinite(n) || n < 0 || n > 100000) {
      ctx.addIssue({ code: "custom", message: "Enter a dollar amount" });
      return z.NEVER;
    }
    return Math.round(n * 100);
  });

// What the add form sends. A preset fills in the name and price; "other" needs both typed.
export function parseCharge(input: unknown) {
  return z
    .object({
      id: z.string().uuid("Missing job"),
      preset: z.enum(["sample", "trip", "other"]),
      qty: z.string().trim().transform((v) => (v === "" ? 1 : Number(v))).pipe(z.number().gt(0, "Enter a quantity").max(1000, "Enter a quantity")),
      description: z.string().trim().max(120).optional().default(""),
      price: dollars.optional(),
    })
    .superRefine((v, ctx) => {
      if (v.preset === "other") {
        if (!v.description) ctx.addIssue({ code: "custom", path: ["description"], message: "Describe the charge" });
        if (v.price == null) ctx.addIssue({ code: "custom", path: ["price"], message: "Enter the price" });
      }
    })
    .transform((v) => {
      if (v.preset === "sample") return { id: v.id, kind: "material" as const, description: v.description || "Lab sample", qty: v.qty, unit_cents: v.price ?? SAMPLE_CENTS };
      if (v.preset === "trip") return { id: v.id, kind: "trip" as const, description: v.description || "Trip fee", qty: 1, unit_cents: v.price ?? TRIP_FEE_CENTS };
      return { id: v.id, kind: "other" as const, description: v.description, qty: v.qty, unit_cents: v.price ?? 0 };
    })
    .safeParse(input);
}
