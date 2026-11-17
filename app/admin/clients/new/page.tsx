import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import NewClientForm from "./NewClientForm";

export const metadata: Metadata = {
  title: "Add a client | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

async function Gate() {
  await connection();
  const supabase = await supabaseForUser();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");
  return <NewClientForm />;
}

export default function NewClientPage() {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1 className="adm-title">Add a client</h1>
        <Link className="adm-link" href="/admin/clients">Back to Clients</Link>
      </header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Gate />
      </Suspense>
    </main>
  );
}
