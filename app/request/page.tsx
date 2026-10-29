import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import { Suspense } from "react";
import { connection } from "next/server";
import { nextBookableDates, todayInNewYork } from "@/lib/dates";
import { heldSlots } from "@/lib/availabilityServer";
import RequestFlow from "./RequestFlow";

export const metadata: Metadata = {
  title: "Request a date | Coastal Air Assessments",
};

// Dates depend on today, so this part is built fresh for each visit.
async function Flow() {
  await connection();
  const dates = nextBookableDates(new Date(), 40, 1);
  const held = await heldSlots(todayInNewYork());
  return <RequestFlow dates={dates} held={held} />;
}

export default function RequestPage() {
  return (
    <>
      <header className="wrap site-header">
        <Logo />
      </header>
      <main className="wrap">
        <Suspense fallback={<p className="step-count">Loading...</p>}>
          <Flow />
        </Suspense>
      </main>
    </>
  );
}
