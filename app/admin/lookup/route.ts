// Search for the Add screen: past clients and the properties we have visited. Admin only.
import { NextResponse, connection } from "next/server";
import { supabaseForUser } from "@/lib/supabase/server";

type Hit = { name: string; address: string; phone: string | null; kind: "client" | "job" };

export async function GET(request: Request) {
  await connection();
  const supabase = await supabaseForUser();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return NextResponse.json({ hits: [] }, { status: 401 });
  const { data: ok } = await supabase.rpc("is_admin");
  if (!ok) return NextResponse.json({ hits: [] }, { status: 403 });

  const url = new URL(request.url);
  const contractor = url.searchParams.get("contractor") ?? "";
  const term = (url.searchParams.get("q") ?? "").replace(/[,()%_\\*]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  const hits: Hit[] = [];

  if (/^[0-9a-f-]{36}$/i.test(contractor)) {
    const { data } = await supabase.from("requests").select("name, address, city, phone").eq("contractor_id", contractor).order("created_at", { ascending: false }).limit(60);
    for (const r of data ?? []) hits.push({ name: r.name, address: [r.address, r.city].filter(Boolean).join(", "), phone: r.phone ?? null, kind: "job" });
  } else if (term.length >= 2) {
    const like = `%${term}%`;
    const [c, j] = await Promise.all([
      supabase.from("clients").select("name, address, phone").or(`name.ilike.${like},address.ilike.${like}`).order("name").limit(12),
      supabase.from("requests").select("name, address, city, phone").or(`name.ilike.${like},address.ilike.${like}`).order("created_at", { ascending: false }).limit(20),
    ]);
    for (const r of j.data ?? []) hits.push({ name: r.name, address: [r.address, r.city].filter(Boolean).join(", "), phone: r.phone ?? null, kind: "job" });
    for (const r of c.data ?? []) hits.push({ name: r.name, address: r.address ?? "", phone: r.phone ?? null, kind: "client" });
  }

  const seen = new Set<string>();
  const out = hits.filter((h) => {
    const k = `${h.name.toLowerCase()}|${h.address.toLowerCase()}`;
    if (!h.address && !h.name) return false;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 20);
  return NextResponse.json({ hits: out });
}
