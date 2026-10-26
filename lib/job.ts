import { z } from "zod";

// Turns a drawer form into columns to save. Empty boxes become null.
const text = (max: number) =>
  z.string().trim().max(max).transform((v) => (v === "" ? null : v)).nullable().optional();
const date = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Pick a valid date")
  .nullable()
  .optional();
const dollars = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    const n = Number(v.replace(/[$,]/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({ code: "custom", message: "Enter a dollar amount" });
      return z.NEVER;
    }
    return Math.round(n * 100);
  })
  .nullable()
  .optional();
const count = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > 50) {
      ctx.addIssue({ code: "custom", message: "Enter a whole number" });
      return z.NEVER;
    }
    return n;
  })
  .nullable()
  .optional();

const sections = {
  client: z.object({
    qb_customer_id: text(60),
    repeat_client: z.string().optional().transform((v) => v === "on"),
  }),
  lab: z.object({
    lab_name: text(100),
    lab_samples: count,
    lab_coc: text(60),
    lab_sent_on: date,
    lab_results_on: date,
    lab_cost_cents: dollars,
  }),
  money: z.object({
    deposit_invoice_no: text(60),
    final_invoice_no: text(60),
    extras_cents: dollars.transform((v) => v ?? 0),
    payment_method: z.enum(["", "card", "check", "cash", "ach", "other"]).transform((v) => (v === "" ? null : v)),
  }),
} as const;

export type Section = keyof typeof sections;
export const isSection = (v: unknown): v is Section =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(sections, v);

export function parseSection(section: Section, input: Record<string, FormDataEntryValue | null>) {
  const clean: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(input)) clean[k] = typeof v === "string" ? v : undefined;
  // Unchecked boxes are absent from a form; text boxes arrive as "".
  return sections[section].safeParse(clean);
}
