// SERVER ONLY. A Supabase client that acts as the logged-in person (not the service key).
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function supabaseUrlAndKey() {
  const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();
  const url = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_PUBLISHABLE_KEY);
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY");
  return { url, key };
}

export async function supabaseForUser() {
  const store = await cookies(); // first: marks the page as per-visitor, never prebuilt
  const { url, key } = supabaseUrlAndKey();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a page render, where cookies are read-only. The proxy refreshes them.
        }
      },
    },
  });
}
