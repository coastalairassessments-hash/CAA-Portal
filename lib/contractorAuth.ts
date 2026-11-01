import { z } from "zod";
import { TIMES } from "./request";
import { BOOKABLE_WEEKDAYS, isRealDate, todayInNewYork, weekdayOf } from "./dates";

export const LOGIN_MINUTES = 15;
export const SESSION_DAYS = 30;
export const COOKIE = "caa_contractor";

export function newToken(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}
export const validToken = (t: unknown): t is string => typeof t === "string" && /^[0-9a-f]{64}$/.test(t);

// Only a hash is stored, so a leaked table cannot sign anyone in.
export async function hashToken(token: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const loginExpiry = (now: Date = new Date()) => new Date(now.getTime() + LOGIN_MINUTES * 60_000).toISOString();
export const sessionExpiry = (now: Date = new Date()) => new Date(now.getTime() + SESSION_DAYS * 86_400_000).toISOString();

export const parseEmail = (v: unknown) => z.string().trim().toLowerCase().pipe(z.email().max(200)).safeParse(v);

export const PRV_HOURS = 2;
export const CONTRACTOR_SERVICES = [
  { value: "prv", label: "Post-remediation verification (PRV)" },
  { value: "assessment", label: "Mold and air quality assessment" },
] as const;

// What a contractor fills in to schedule: where, when, and who to meet. Mon to Thu, 10:00 or 12:30.
export function parseContractorRequest(input: unknown, now: Date = new Date()) {
  const today = todayInNewYork(now);
  return z
    .object({
      service: z.enum(["prv", "assessment"], { error: "Pick a service" }),
      address: z.string().trim().min(3, "Enter the job address").max(200),
      date: z
        .string()
        .refine(isRealDate, "Pick a valid date")
        .refine((v) => v > today, "Pick a day after today")
        .refine((v) => BOOKABLE_WEEKDAYS.includes(weekdayOf(v)), "We schedule Monday through Thursday"),
      time: z.enum(TIMES, { error: "Pick a time" }),
      contactName: z.string().trim().max(100).optional().default(""),
      contactPhone: z.string().trim().max(40).optional().default(""),
      note: z.string().trim().max(500).optional().default(""),
    })
    .safeParse(input);
}
