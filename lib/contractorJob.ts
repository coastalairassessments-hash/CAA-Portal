import { z } from "zod";
import { isRealDate, todayInNewYork } from "./dates";

export const SERVICES = [
  { value: "prv", label: "Post-remediation verification (PRV)", issue: "post_remediation" },
  { value: "assessment", label: "Mold and air quality assessment", issue: "air_quality" },
] as const;

// What Cory enters on the Add screen: a contractor, a service, a place and a time.
export function parseContractorJob(input: unknown, now: Date = new Date()) {
  const today = todayInNewYork(now);
  return z
    .object({
      contractorId: z.union([z.literal(""), z.string().uuid()]).optional().default(""),
      newName: z.string().trim().max(100).optional().default(""),
      service: z.enum(["prv", "assessment"], { error: "Pick a service" }),
      address: z.string().trim().min(3, "Enter the job address").max(200),
      date: z
        .string()
        .refine(isRealDate, "Pick a valid date")
        .refine((v) => v >= today, "Pick a date that is not in the past"),
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a start time"),
      hours: z.coerce.number().int("Pick the hours").min(1, "Pick the hours").max(8, "Pick the hours"),
    })
    .refine((v) => v.contractorId !== "" || v.newName !== "", {
      message: "Pick a contractor or type a new name",
      path: ["newName"],
    })
    .safeParse(input);
}

export const issueForService = (service: "prv" | "assessment") =>
  SERVICES.find((s) => s.value === service)!.issue;
