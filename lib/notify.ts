import type { NewRequestRow } from "./submit";

const ISSUE_LABELS: Record<string, string> = {
  musty_smell: "Musty smell",
  water_damage: "Water damage",
  post_remediation: "Post-remediation (PRV)",
  air_quality: "Air quality",
  other: "Other",
};

const SIZE_LABELS: Record<string, string> = {
  under_2000: "Under 2,000 sq ft",
  "2000_4000": "2,000 to 4,000 sq ft",
  "4000_6000": "4,000 to 6,000 sq ft",
  over_6000: "Over 6,000 sq ft",
};

export function buildAlert(row: NewRequestRow & { id: string }) {
  const outside = row.area === "outside" ? " [OUTSIDE AREA]" : "";
  const subject = `New request: ${ISSUE_LABELS[row.issue] ?? row.issue}, ${row.city} ${row.zip}${outside}`;
  const lines = [
    `Name: ${row.name}`,
    `Phone: ${row.phone}${row.text_consent ? " (OK to text)" : " (no texting)"}`,
    `Email: ${row.email}`,
    `Property: ${row.address}, ${row.city} ${row.zip}${outside}`,
    `Issue: ${ISSUE_LABELS[row.issue] ?? row.issue}`,
    `Size: ${SIZE_LABELS[row.size_band] ?? row.size_band}`,
    `Preferred: ${row.preferred_date} at ${row.preferred_time}`,
    row.notes ? `Notes: ${row.notes}` : "",
  ].filter(Boolean);
  return { subject, text: lines.join("\n") };
}

// Email alert via Resend. Optional: if the keys are not set, it quietly skips.
export async function sendEmailAlert(
  row: NewRequestRow & { id: string },
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const key = env.RESEND_API_KEY;
  const to = env.ALERT_EMAIL;
  const from = env.ALERT_FROM;
  if (!key || !to || !from) return;

  const { subject, text } = buildAlert(row);
  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!res.ok) throw new Error(`Email alert failed: ${res.status}`);
}
