import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";
import { todayInNewYork } from "@/lib/dates";
import AddForm from "./AddForm";

export const metadata: Metadata = {
  title: "Add a job | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

async function Loader() {
  await connection();
  const supabase = await supabaseForUser();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");
  const { data } = await supabase.from("contractors").select("id, name").order("name");
  return <AddForm contractors={data ?? []} defaultDate={todayInNewYork()} />;
}

export default function AddPage() {
  return (
    <main className="adm-wrap">
      <header className="adm-top">
        <h1 className="adm-title">Add a job</h1>
      </header>
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Loader />
      </Suspense>
    </main>
  );
}
