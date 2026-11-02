import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import { publicResources } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Resources | Coastal Air Assessments",
  description: "Plain guides for keeping your home dry and free of mold.",
};

export default function ResourcesPage() {
  const guides = publicResources();
  return (
    <>
      <header className="wrap site-header">
        <Logo />
      </header>
      <main className="wrap terms">
        <h1>Resources</h1>
        <p className="muted">Plain guides from your assessor.</p>
        {guides.length === 0 && <p>New guides are on the way.</p>}
        <ul className="guide-list">
          {guides.map((g) => (
            <li key={g.href}>
              <Link href={g.href}>{g.title}</Link>
              <span>{g.summary}</span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
