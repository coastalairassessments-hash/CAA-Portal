// Keeps the admin login fresh so Cory stays signed in for weeks. Runs only on /admin.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const clean = (v?: string) => v?.trim().replace(/^["']+|["']+$/g, "").trim();
  const url = clean(process.env.SUPABASE_URL);
  const key = clean(process.env.SUPABASE_PUBLISHABLE_KEY);
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser(); // refreshes the session cookie if needed
  return response;
}

export const config = { matcher: "/admin/:path*" };
