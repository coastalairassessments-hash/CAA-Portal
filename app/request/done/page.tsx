import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/app/components/Logo";

export const metadata: Metadata = {
  title: "Request received | Coastal Air Assessments",
  robots: { index: false },
};

export default function DonePage() {
  return (
    <>
      <header className="wrap site-header">
        <Logo />
      </header>
      <main className="wrap done">
        <h1>Request received.</h1>
        <p>
          We will review it and confirm your date by phone, text or email. There is no payment
          today.
        </p>
        <p>
          Once your date is confirmed, you will get a link to pay a 75% deposit, which holds the
          date for you.
        </p>
        <p style={{ marginTop: "1.75rem" }}>
          <Link href="/" className="btn btn-quiet">
            Back to home
          </Link>
        </p>
      </main>
    </>
  );
}
