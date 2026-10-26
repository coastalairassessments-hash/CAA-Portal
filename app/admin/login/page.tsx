import type { Metadata } from "next";
import Image from "next/image";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="adm-wrap" style={{ paddingTop: "4rem" }}>
      <div className="adm-logo">
        <Image src="/caa-logo.png" alt="Coastal Air Assessments" width={96} height={89} priority />
      </div>
      <h1 className="adm-title" style={{ marginBottom: 16 }}>Sign in</h1>
      <LoginForm />
    </main>
  );
}
