import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import { formatPhone, formatTime, issueLabel, sizeLabel } from "@/lib/labels";
import { formatDateLabel } from "@/lib/dates";
import { logout } from "./actions";

export const metadata: Metadata = {
  title: "Your list | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Row = {
  id: string;
  created_at: string;
  status: string;
  issue: string;
  size_band: string;
  preferred_date: string;
  preferred_time: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  notes: string;
  text_consent: boolean;
  area: "core" | "outside";
};

async function List() {
  const supabase = await supabaseForUser();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return (
      <p className="error">
        This account is signed in but is not on the admin list. Add it to admin_users in Supabase.
      </p>
    );
  }

  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, created_at, status, issue, size_band, preferred_date, preferred_time, name, phone, email, address, city, zip, notes, text_consent, area",
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return <p className="error">Could not load requests. (Ref: list-{error.code ?? "unknown"})</p>;

  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return <p>No requests yet.</p>;

  return (
    <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "1rem" }}>
      {rows.map((r) => (
        <li
          key={r.id}
          style={{
            border: "1px solid var(--line)",
            borderLeft: `6px solid ${r.area === "outside" ? "var(--signal)" : "var(--tide)"}`,
            borderRadius: 8,
            padding: "1rem",
            background: "#fff",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>
            {r.name}
            {r.area === "outside" && (
              <span style={{ color: "var(--signal)", marginLeft: 8 }}>OUTSIDE AREA</span>
            )}
            <span style={{ color: "var(--muted)", marginLeft: 8, fontWeight: 400 }}>
              {r.status}
            </span>
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            {issueLabel(r.issue)} · {sizeLabel(r.size_band)}
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            Wants {formatDateLabel(r.preferred_date)} at {formatTime(r.preferred_time)}
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            {r.address}, {r.city} {r.zip}
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            <a href={`tel:${r.phone}`}>{formatPhone(r.phone)}</a>
            {r.text_consent ? " (ok to text)" : " (no texting)"} ·{" "}
            <a href={`mailto:${r.email}`}>{r.email}</a>
          </p>
          {r.notes && <p style={{ margin: "0.25rem 0" }}>Notes: {r.notes}</p>}
        </li>
      ))}
    </ul>
  );
}

export default function AdminPage() {
  return (
    <main className="wrap" style={{ paddingBlock: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Your list</h1>
        <form action={logout}>
          <button className="btn btn-quiet btn-small" type="submit">Sign out</button>
        </form>
      </header>
      <Suspense fallback={<p>Loading...</p>}>
        <List />
      </Suspense>
    </main>
  );
}
