import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="wrap" style={{ maxWidth: 420, paddingBlock: "4rem" }}>
      <h1>Sign in</h1>
      <LoginForm />
    </main>
  );
}
