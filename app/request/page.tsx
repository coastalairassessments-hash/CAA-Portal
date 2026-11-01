import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import { Suspense } from "react";
import { connection } from "next/server";
import { nextBookableDates, todayInNewYork } from "@/lib/dates";
import { heldSlots } from "@/lib/availabilityServer";
import { prefillByToken } from "@/lib/bookingServer";
import RequestFlow from "./RequestFlow";
import { parseRefCode } from "@/lib/referrals";
import { LICENSE_LINE, PHONE } from "@/lib/business";

export const metadata: Metadata = {
  title: "Request a date | Coastal Air Assessments",
};

// Dates depend on today, so this part is built fresh for each visit.
async function Flow({ again, refCode }: { again?: string; refCode?: string }) {
  await connection();
  const prefill = again ? await prefillByToken(again) : null;
  const dates = nextBookableDates(new Date(), 40, 1);
  const held = await heldSlots(todayInNewYork());
  return <RequestFlow dates={dates} held={held} again={prefill ?? undefined} refCode={parseRefCode(refCode) ?? undefined} />;
}

async function FlowFromQuery({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  return <Flow again={typeof q.again === "string" ? q.again : undefined} refCode={typeof q.ref === "string" ? q.ref : undefined} />;
}

export default function RequestPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <>
      <header className="wrap site-header">
        <Logo />
      </header>
      <main className="wrap">
        <p className="trust-line">{LICENSE_LINE} · Questions? Call or text <a href="tel:+15614000929">{PHONE}</a></p>
        <Suspense fallback={<p className="step-count">Loading...</p>}>
          <FlowFromQuery searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
