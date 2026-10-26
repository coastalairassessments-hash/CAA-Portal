import { Suspense } from "react";
import { supabaseForUser } from "@/lib/supabase/server";
import { todayInNewYork } from "@/lib/dates";
import TabBar, { type NavCounts } from "./TabBar";

// Loads the numbers for the bottom bar. Shows nothing when signed out (login page).
async function Counts() {
  const supabase = await supabaseForUser();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;
  const { data: ok } = await supabase.rpc("is_admin");
  if (!ok) return null;
  const { data } = await supabase
    .from("requests")
    .select("status, confirmed_date")
    .in("status", ["new", "offered", "confirmed"])
    .limit(500);
  const today = todayInNewYork();
  const rows = data ?? [];
  const counts: NavCounts = {
    today: rows.filter((r) => r.status === "confirmed" && r.confirmed_date === today).length,
    requests: rows.filter((r) => r.status === "new" || r.status === "offered").length,
  };
  return <TabBar counts={counts} />;
}

export default function NavBar() {
  return (
    <Suspense fallback={null}>
      <Counts />
    </Suspense>
  );
}
