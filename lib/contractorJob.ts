import { z } from "zod";
import { addDays, isRealDate, todayInNewYork } from "./dates";
import { LATEST_START } from "./slots";

export const SERVICES = [
  { value: "prv", label: "Post-remediation verification (PRV)", issue: "post_remediation" },
  { value: "assessment", label: "Mold and air quality assessment", issue: "air_quality" },
] as const;

// What Cory enters on the Add screen: a contractor, a service, a place and a time.
export function parseContractorJob(input: unknown, now: Date = new Date()) {
  const today = todayInNewYork(now);
  const oldest = addDays(today, -120);
  return z
    .object({
      contractorId: z.union([z.literal(""), z.string().uuid()]).optional().default(""),
      newName: z.string().trim().max(100).optional().default(""),
      service: z.enum(["prv", "assessment"], { error: "Pick a service" }),
      address: z.string().trim().min(3, "Enter the job address").max(200),
      date: z.string().refine(isRealDate, "Pick a valid date"),
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a start time"),
      notes: z.string().trim().max(1000).optional().default(""),
      invoiceNote: z.string().trim().max(500).optional().default(""),
      reference: z.string().trim().max(80).optional().default(""),
      hours: z.coerce.number().int("Pick the hours").min(1, "Pick the hours").max(8, "Pick the hours"),
      // "" = still to come. "done" = already happened, bill the time. "trip" = already happened, not ready, bill the trip fee.
      outcome: z.enum(["", "done", "trip"]).optional().default(""),
    })
    .refine((v) => v.contractorId !== "" || v.newName !== "", {
      message: "Pick a contractor or type a new name",
      path: ["newName"],
    })
    .refine((v) => (v.outcome === "" ? v.date >= today : v.date <= today && v.date >= oldest), {
      message: "For a job still to come pick today or later. For a job that already happened pick a date in the last 4 months.",
      path: ["date"],
    })
    .refine((v) => v.outcome !== "" || v.time <= LATEST_START, { message: "The latest start is 1:00 PM", path: ["time"] })
    .safeParse(input);
}

export const issueForService = (service: "prv" | "assessment") =>
  SERVICES.find((s) => s.value === service)!.issue;
