import { z } from "zod";

export const REFERRAL_KINDS = [
  { value: "realtor", label: "Realtor" },
  { value: "contractor", label: "Contractor" },
  { value: "plumber", label: "Plumber" },
  { value: "past_client", label: "Past client" },
  { value: "other", label: "Other" },
] as const;

export const kindLabel = (k: string) => REFERRAL_KINDS.find((x) => x.value === k)?.label ?? "Other";

// The code that rides in the link. Letters, numbers and dashes only, so it is safe anywhere.
export const REF_CODE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;
export const parseRefCode = (v: unknown): string | null =>
  typeof v === "string" && REF_CODE.test(v.trim().toLowerCase()) ? v.trim().toLowerCase() : null;

// "Jane Smith, Realtor" becomes jane-smith-realtor. A number is added when the code is already taken.
export function makeCode(name: string, taken: readonly string[]): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30)
      .replace(/-+$/g, "") || "partner";
  const root = base.length >= 3 ? base : `${base}-ref`;
  if (!taken.includes(root)) return root;
  for (let i = 2; i < 100; i++) {
    const c = `${root}-${i}`;
    if (!taken.includes(c)) return c;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export const parsePartner = (input: unknown) =>
  z
    .object({
      name: z.string().trim().min(2, "Enter a name").max(80),
      kind: z.enum(REFERRAL_KINDS.map((k) => k.value) as [string, ...string[]]),
    })
    .safeParse(input);

export const referralLink = (code: string, siteUrl: string) => `${siteUrl.replace(/\/+$/, "")}/request?ref=${code}`;

export type PartnerStat = { code: string; name: string; kind: string; jobs: number; paid: number };

// Counts jobs and paid jobs per partner. A code with no partner (a deleted one) is left out.
export function tally(
  partners: { code: string; name: string; kind: string }[],
  jobs: { referral_code?: string | null; final_paid_at?: string | null }[],
): PartnerStat[] {
  const by = new Map<string, PartnerStat>(partners.map((p) => [p.code, { ...p, jobs: 0, paid: 0 }]));
  for (const j of jobs) {
    const s = j.referral_code ? by.get(j.referral_code) : undefined;
    if (!s) continue;
    s.jobs++;
    if (j.final_paid_at) s.paid++;
  }
  return [...by.values()].sort((a, b) => b.jobs - a.jobs || a.name.localeCompare(b.name));
}
