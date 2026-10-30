// Who is asking and what kind of property. One home for the choices, labels and rules,
// shared by the request form, the checks on the server, and the admin screens.

export const CLIENT_TYPES = [
  { value: "homeowner", label: "Homeowner", hint: "My own home", short: "Homeowner" },
  { value: "manager", label: "Property manager or HOA board", hint: "Condo, HOA or a rental portfolio", short: "Property manager" },
  { value: "landlord", label: "Landlord", hint: "I own a rental property", short: "Landlord" },
  { value: "real_estate", label: "Buying or selling", hint: "Buyer, seller or realtor", short: "Real estate" },
  { value: "contractor", label: "Contractor or restoration company", hint: "Booking for a client", short: "Contractor" },
  { value: "business", label: "Business owner", hint: "Office, shop or other commercial space", short: "Business" },
  { value: "other", label: "Something else", hint: "Insurance, attorney or other", short: "Other" },
] as const;

export const PROPERTY_TYPES = [
  { value: "single_family", label: "Single-family home" },
  { value: "condo", label: "Condo or townhome" },
  { value: "multifamily", label: "Apartment building" },
  { value: "commercial", label: "Commercial or office" },
  { value: "other", label: "Other" },
] as const;

export const CLIENT_TYPE_VALUES = CLIENT_TYPES.map((t) => t.value) as [string, ...string[]];
export const PROPERTY_TYPE_VALUES = PROPERTY_TYPES.map((t) => t.value) as [string, ...string[]];

export const clientTypeLabel = (v: string) => CLIENT_TYPES.find((t) => t.value === v)?.short ?? v;
export const propertyTypeLabel = (v: string) => PROPERTY_TYPES.find((t) => t.value === v)?.label ?? v;

// Types that act for an organization, so we ask for the company and who pays.
export const ORG_TYPES: readonly string[] = ["manager", "contractor", "business"];
export const isOrg = (clientType: string) => ORG_TYPES.includes(clientType);
// A landlord or realtor may or may not have a company, so it is optional for them.
export const asksCompany = (clientType: string) => isOrg(clientType) || clientType === "landlord" || clientType === "real_estate";

// Bigger buildings vary too much for a fixed first-hour price, so we confirm it with them.
export const needsQuote = (propertyType: string) => propertyType === "multifamily" || propertyType === "commercial";
export const isMultiUnit = (propertyType: string) => propertyType === "condo" || propertyType === "multifamily" || propertyType === "commercial";

export const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Not sure" },
] as const;

export const WATER_WHEN = [
  { value: "now", label: "It is happening now" },
  { value: "week", label: "In the last week" },
  { value: "month", label: "In the last month" },
  { value: "older", label: "Longer ago" },
  { value: "unknown", label: "I don't know" },
] as const;

const yesNo = (v: unknown) => YES_NO.find((o) => o.value === v)?.label;
const waterWhen = (v: unknown) => WATER_WHEN.find((o) => o.value === v)?.label;

export type IntakeDetails = {
  role?: string;
  canApprove?: string;
  billTo?: string;
  units?: string;
  waterWhen?: string;
  leakFixed?: string;
  insuranceClaim?: string;
  closingDate?: string;
};

// The answers as label and value pairs, for the admin screens. Skips anything not answered.
export function intakeLines(row: {
  client_type?: string | null;
  property_type?: string | null;
  company?: string | null;
  intake?: IntakeDetails | null;
}): [string, string][] {
  const d = row.intake ?? {};
  const out: [string, string | undefined][] = [
    ["Who", row.client_type ? clientTypeLabel(row.client_type) : undefined],
    ["Property", row.property_type ? propertyTypeLabel(row.property_type) : undefined],
    ["Company", row.company || undefined],
    ["Role", d.role],
    ["Can approve and pay", yesNo(d.canApprove)],
    ["Send invoice to", d.billTo],
    ["Units or areas", d.units],
    ["Water event", waterWhen(d.waterWhen)],
    ["Leak fixed", yesNo(d.leakFixed)],
    ["Insurance claim", yesNo(d.insuranceClaim)],
    ["Closing date", d.closingDate],
  ];
  return out.filter((x): x is [string, string] => !!x[1]);
}
