import { cookies } from "next/headers";
import { qbConfig } from "@/lib/qb";
import { isAdminUser } from "@/lib/qbAdmin";
import { saveConnection, tokenRequest } from "@/lib/qbStore";

export async function GET(request: Request) {
  const back = (qb: string, why?: string) =>
    Response.redirect(new URL(`/admin/more?qb=${qb}${why ? `&why=${encodeURIComponent(why)}` : ""}`, request.url), 303);
  if (!(await isAdminUser())) return Response.redirect(new URL("/admin/login", request.url), 303);

  const params = new URL(request.url).searchParams;
  const store = await cookies();
  const expected = store.get("qb_state")?.value;
  store.delete("qb_state");
  const code = params.get("code");
  const realm = params.get("realmId");
  if (params.get("error") || !code || !realm) return back("denied");
  if (!expected || expected !== params.get("state")) {
    console.error(`QuickBooks callback: state mismatch (cookie ${expected ? "present" : "missing"})`);
    return back("failed", expected ? "The sign-in check did not match. Start again from the same browser." : "The sign-in check was lost. Start again and finish in the same browser.");
  }

  try {
    const reply = await tokenRequest({
      grant_type: "authorization_code",
      code,
      redirect_uri: qbConfig().redirectUri,
    });
    await saveConnection(realm, reply);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error(`QuickBooks callback failed: ${msg}`);
    return back("failed", msg.slice(0, 160));
  }
  return back("connected");
}
