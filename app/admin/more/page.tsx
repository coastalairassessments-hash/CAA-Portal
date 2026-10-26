import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "../actions";

export const metadata: Metadata = {
  title: "More | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

export default function MorePage() {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1 className="adm-title">More</h1>
      </header>
      <section className="adm-group">
        <Link className="adm-btn wide" href="/admin?tab=booked">Booked jobs</Link>
        <Link className="adm-btn wide" href="/admin?tab=declined">Declined and cancelled</Link>
        <Link className="adm-btn wide" href="/admin?tab=all">All requests</Link>
        <a className="adm-btn wide" href="/request">Public request page</a>
        <a className="adm-btn wide" href="/terms">Terms clients agree to</a>
        <a className="adm-btn wide" href="/policy">Booking policy</a>
      </section>
      <form action={logout}>
        <button className="adm-btn wide" type="submit">Sign out</button>
      </form>
    </main>
  );
}
