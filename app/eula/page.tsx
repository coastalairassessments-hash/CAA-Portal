import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/app/components/Logo";

export const metadata: Metadata = {
  title: "Terms of Use | Coastal Air Assessments",
  description: "Terms of use for the Coastal Air Assessments booking portal.",
};

export default function EulaPage() {
  return (
    <>
      <header className="wrap site-header">
        <Logo />
      </header>
      <main className="wrap section terms">
        <h1>Terms of Use</h1>
        <p className="muted">Coastal Air Assessments booking portal</p>
        <section>
          <h2>Who this is for</h2>
          <p>
            This portal lets clients request and book assessments with Coastal Air Assessments, and
            lets Coastal Air Assessments manage its own schedule, clients and invoices. The
            administrative area is private and for Coastal Air Assessments use only.
          </p>
        </section>
        <section>
          <h2>Using the portal</h2>
          <p>
            Please give accurate information when you request a visit. Do not misuse the portal or
            try to access areas that are not meant for you.
          </p>
        </section>
        <section>
          <h2>Connected services</h2>
          <p>
            The portal connects to QuickBooks Online so Coastal Air Assessments can manage its own
            customers and invoices. It reads and writes only the Coastal Air Assessments account
            that its owner authorizes, and it does not share that data with anyone else.
          </p>
        </section>
        <section>
          <h2>Services and agreements</h2>
          <p>
            Assessments are provided under our{" "}
            <Link href="/terms">Mold Assessment and Sampling Terms</Link> and{" "}
            <Link href="/policy">Booking and Payment Policy</Link>. Our{" "}
            <Link href="/privacy">Privacy Policy</Link> explains how information is handled.
          </p>
        </section>
        <p style={{ marginTop: "2rem" }}>
          <Link href="/">Back to home</Link>
        </p>
      </main>
    </>
  );
}
