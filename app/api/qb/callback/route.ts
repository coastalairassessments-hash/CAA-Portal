import { checkState, qbConfig } from "@/lib/qb";
import { isAdminUser } from "@/lib/qbAdmin";
import { saveConnection, tokenRequest } from "@/lib/qbStore";

export async function GET(request: Request) {
  const back = (qb: string, why?: string) =>
    Response.redirect(new URL(`/admin/more?qb=${qb}${why ? `&why=${encodeURIComponent(why)}` : ""}`, request.url), 303);
  if (!(await isAdminUser())) return Response.redirect(new URL("/admin/login", request.url), 303);

  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const realm = params.get("realmId");
  if (params.get("error") || !code || !realm) return back("denied");
  if (!checkState(params.get("state"), qbConfig().clientSecret)) {
    console.error("QuickBooks callback: sign-in check failed");
    return back("failed", "The sign-in check failed or timed out. Tap Reconnect and finish within a few minutes.");
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
