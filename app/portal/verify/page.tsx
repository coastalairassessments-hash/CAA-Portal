import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Logo from "@/app/components/Logo";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Sign in | Coastal Air Assessments", robots: { index: false, follow: false } };

// The link opens this page and the person taps the button. That way an email scanner that merely opens the link cannot use it up.
async function Verify({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const q = await searchParams;
  const t = typeof q.t === "string" ? q.t : "";
  return (
    <form action={signIn}>
      <input type="hidden" name="t" value={t} />
      <h1>Sign in</h1>
      <p>Tap the button to open your portal.</p>
      <button className="btn" type="submit">Sign in</button>
    </form>
  );
}

export default function VerifyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <>
      <header className="wrap site-header"><Logo /></header>
      <main className="wrap">
        <Suspense fallback={<p>Loading...</p>}>
          <Verify searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
