import type { Metadata } from "next";
import Logo from "@/app/components/Logo";
import { PHONE } from "@/lib/business";

export const metadata: Metadata = {
  title: "Payment received | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

export default function Done() {
  return (
    <>
      <header className="wrap site-header"><Logo /></header>
      <main className="wrap bk">
        <h1>Thank you. Your payment is received.</h1>
        <p className="bk-lead">A receipt is on its way to your email. Questions? Call or text {PHONE}.</p>
      </main>
    </>
  );
}
