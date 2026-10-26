import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import JobView from "./JobView";

export const metadata: Metadata = {
  title: "Request | Coastal Air Assessments",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function Detail({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await supabaseForUser();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin");

  const { data: r } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (!r) notFound();

  return <JobView r={r} query={query} />;
}

export default function RequestDetailPage(props: Props) {
  return (
    <main className="adm-wrap">
      <Suspense fallback={<p className="adm-empty">Loading...</p>}>
        <Detail {...props} />
      </Suspense>
    </main>
  );
}
