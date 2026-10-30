import { z } from "zod";
import { CLIENT_TYPE_VALUES, PROPERTY_TYPE_VALUES, WATER_WHEN, YES_NO, isOrg } from "./intake";
import {
  BOOKABLE_WEEKDAYS,
  addDays,
  isRealDate,
  todayInNewYork,
  weekdayOf,
} from "./dates";

export const ISSUES = [
  "musty_smell",
  "water_damage",
  "post_remediation",
  "air_quality",
  "consultation",
  "other",
] as const;

export const SIZE_BANDS = [
  "under_2000",
  "2000_4000",
  "4000_6000",
  "over_6000",
] as const;

// Bookable times. Cory sets the real slot and block length when he confirms.
export const TIMES = ["10:00", "12:30"] as const;

// Larger properties take more than two hours, so they start at 10:00 and hold the rest of the day.
export const LONG_VISIT_BANDS: readonly string[] = ["2000_4000", "4000_6000", "over_6000"];
export const isLongVisit = (sizeBand: string) => LONG_VISIT_BANDS.includes(sizeBand);
export const timesFor = (sizeBand: string): readonly string[] => (isLongVisit(sizeBand) ? ["10:00"] : TIMES);

export const HOW_HEARD = [
  { value: "google", label: "Google search" },
  { value: "referral", label: "Friend, family or past client" },
  { value: "contractor", label: "Contractor or agent" },
  { value: "social", label: "Facebook or Instagram" },
  { value: "other", label: "Other" },
] as const;

const MAX_DAYS_AHEAD = 120;

// Accepts common US phone formats, returns +1XXXXXXXXXX
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

// The form sends every follow-up, filled or not. Blank ones are simply dropped.
const dropBlank = (v: unknown) =>
  v && typeof v === "object" ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== "" && x != null)) : v;

const yesNoEnum = z.enum(YES_NO.map((o) => o.value) as [string, ...string[]]);

// Follow-up answers. Every one is optional, and the form only shows the ones that apply.
const detailsSchema = z
  .object({
    role: z.string().trim().max(100),
    canApprove: yesNoEnum,
    billTo: z.string().trim().max(200),
    units: z.string().trim().max(60),
    waterWhen: z.enum(WATER_WHEN.map((o) => o.value) as [string, ...string[]]),
    leakFixed: yesNoEnum,
    insuranceClaim: yesNoEnum,
    closingDate: z.string().refine(isRealDate, "Enter a valid closing date"),
  })
  .partial();

export function buildRequestSchema(now: Date = new Date()) {
  const today = todayInNewYork(now);
  const latest = addDays(today, MAX_DAYS_AHEAD);

  return z.object({
    clientType: z.enum(CLIENT_TYPE_VALUES).optional().default("homeowner"),
    propertyType: z.enum(PROPERTY_TYPE_VALUES).optional(),
    company: z.string().trim().max(150).optional().default(""),
    details: z.preprocess(dropBlank, detailsSchema.optional().default({})),
    issue: z.enum(ISSUES),
    sizeBand: z.enum(SIZE_BANDS),
    preferredDate: z
      .string()
      .refine(isRealDate, "Pick a valid date")
      .refine((v) => v >= today, "Pick a date that is not in the past")
      .refine((v) => v <= latest, "Pick a date within the next 4 months")
      .refine(
        (v) => BOOKABLE_WEEKDAYS.includes(weekdayOf(v)),
        "We schedule Monday through Thursday",
      ),
    preferredTime: z.enum(TIMES),
    name: z.string().trim().min(1, "Enter your name").max(100),
    phone: z
      .string()
      .trim()
      .max(30)
      .transform((v, ctx) => {
        const n = normalizePhone(v);
        if (!n) {
          ctx.addIssue({ code: "custom", message: "Enter a valid phone number" });
          return z.NEVER;
        }
        return n;
      }),
    email: z.email("Enter a valid email").max(200),
    address: z.string().trim().min(3, "Enter the property address").max(200),
    city: z.string().trim().min(1, "Enter the city").max(100),
    zip: z
      .string()
      .trim()
      .regex(/^\d{5}(-\d{4})?$/, "Enter a 5-digit ZIP code")
      .transform((v) => v.slice(0, 5)),
    notes: z.string().trim().max(1000).optional().default(""),
    howHeard: z.enum(["google", "referral", "contractor", "social", "other"]).optional(),
    textConsent: z.boolean(),
    termsAccepted: z.literal(true, { error: "Please agree to the terms and policy to continue" }),
    // Honeypot: real people never see or fill this field. Bots do.
    website: z.string().max(0).optional().default(""),
  }).refine((v) => !isOrg(v.clientType) || v.company.length > 0, {
    message: "Enter the company or association name",
    path: ["company"],
  }).refine((v) => timesFor(v.sizeBand).includes(v.preferredTime), {
    message: "Larger properties start at 10:00 AM",
    path: ["preferredTime"],
  });
}

export type RequestInput = z.input<ReturnType<typeof buildRequestSchema>>;
export type ValidRequest = z.output<ReturnType<typeof buildRequestSchema>>;

export function parseRequest(input: unknown, now: Date = new Date()) {
  return buildRequestSchema(now).safeParse(input);
}
