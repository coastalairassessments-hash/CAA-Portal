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
        <p>We will reply with your day and time. There is nothing to pay today.</p>
        <p>
          A 75% deposit then holds your date. If two people ask for the same time, the first
          deposit gets it.
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
