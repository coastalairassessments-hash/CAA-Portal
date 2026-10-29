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
        <p>We will confirm your time shortly. There is nothing to pay today.</p>
        <ol className="how">
          <li><strong>We confirm</strong> and send a secure deposit link.</li>
          <li><strong>Your deposit locks the time.</strong> 75% of the first hour. If two people ask for the same time, the first deposit gets it.</li>
          <li><strong>Cancel more than 24 hours ahead</strong> and the deposit is refunded.</li>
        </ol>
        <p style={{ marginTop: "1.75rem" }}>
          <Link href="/" className="btn btn-quiet">
            Back to home
          </Link>
        </p>
      </main>
    </>
  );
}
