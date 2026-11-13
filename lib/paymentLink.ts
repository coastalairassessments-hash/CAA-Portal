// What Cory types to send a one-off payment link. Pure.
import { z } from "zod";

export function parsePaymentLink(input: unknown, needEmail = true) {
  return z
    .object({
      name: z.string().trim().min(1, "Enter the client name").max(200),
      email: needEmail
        ? z.string().trim().toLowerCase().email("Enter a valid email").max(200)
        : z.string().trim().toLowerCase().max(200).refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Enter a valid email"),
      description: z.string().trim().min(1, "Enter what this is for").max(200),
      amount: z
        .string()
        .transform((v) => Number(v.replace(/[$,\s]/g, "")))
        .refine((n) => Number.isFinite(n) && n >= 1 && n <= 100000, "Enter an amount between $1 and $100,000"),
    })
    .transform((v) => ({ name: v.name, email: v.email === "" ? null : v.email, description: v.description, amount_cents: Math.round(v.amount * 100) }))
    .safeParse(input);
}

export function paymentLinkEmail(o: { name: string; description: string; cents: number; link: string }) {
  const first = o.name.trim().split(/\s+/)[0];
  const money = `$${(o.cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return {
    subject: "Your balance - Coastal Air Assessments",
    text: [
      `Hi ${first},`,
      "",
      `This is your balance with Coastal Air Assessments: ${o.description}.`,
      "",
      `Amount due: ${money}`,
      "",
      "Pay securely by card:",
      o.link,
      "",
      "Questions? Reply to this email.",
      "",
      "Coastal Air Assessments",
    ].join("\n"),
  };
}
