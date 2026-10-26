import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/app/components/Logo";

export const metadata: Metadata = {
  title: "Privacy Policy | Coastal Air Assessments",
  description: "What information Coastal Air Assessments collects through its booking portal and how it is used.",
};

const sections: { title: string; text: string }[] = [
  {
    title: "What we collect",
    text: "When you request a visit, we collect your name, phone number, email, the property address, what you are seeing, and your preferred day and time. We also record that you agreed to our terms and booking policy, with the date and time.",
  },
  {
    title: "How we use it",
    text: "We use it to schedule and carry out your assessment, send you messages about your visit, invoice you, and keep the records our work requires. We text you only if you say we may.",
  },
  {
    title: "Who sees it",
    text: "We do not sell your information. It is handled by the services we use to run the business: our hosting and database providers, our email sender, and our accounting software (QuickBooks), which holds client and payment records. Laboratories receive only what is needed to analyze samples.",
  },
  {
    title: "Payments",
    text: "Card payments are processed by QuickBooks Payments. We do not store your card number.",
  },
  {
    title: "How long we keep it",
    text: "We keep job and client records for as long as our professional licensing and business records require.",
  },
  {
    title: "Your choices",
    text: "You can ask us to correct your information, or to stop texting you, at any time. Contact us through coastalairassessments.com.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <header className="wrap site-header">
        <Logo />
      </header>
      <main className="wrap section terms">
        <h1>Privacy Policy</h1>
        <p className="muted">Coastal Air Assessments</p>
        {sections.map((s) => (
          <section key={s.title}>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
          </section>
        ))}
        <p style={{ marginTop: "2rem" }}>
          <Link href="/">Back to home</Link>
        </p>
      </main>
    </>
  );
}
