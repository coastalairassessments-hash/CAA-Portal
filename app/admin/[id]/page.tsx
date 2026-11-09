import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { supabaseForUser } from "@/lib/supabase/server";
import JobView from "./JobView";
import { driveZone, type Zoned } from "@/lib/driveTime";
import { todayInNewYork } from "@/lib/dates";

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

  // Other booked visits, so the approve screen can warn about a long drive between them.
  const { data: others } = await supabase
    .from("requests")
    .select("confirmed_date, confirmed_time, block_hours, zip")
    .eq("status", "confirmed")
    .neq("id", id)
    .gte("confirmed_date", todayInNewYork());
  const booked: Zoned[] = (others ?? [])
    .filter((o) => o.confirmed_date && o.confirmed_time)
    .map((o) => ({
      date: o.confirmed_date as string,
      time: String(o.confirmed_time).slice(0, 5),
      hours: Number(o.block_hours ?? 1),
      zone: driveZone(o.zip as string | null),
    }));

  return <JobView r={r} query={query} booked={booked} />;
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
