import { authorizeUrl, makeState, qbConfig } from "@/lib/qb";
import { isAdminUser } from "@/lib/qbAdmin";

export async function GET(request: Request) {
  if (!(await isAdminUser())) return Response.redirect(new URL("/admin/login", request.url), 303);
  let url: string;
  try {
    const c = qbConfig();
    url = authorizeUrl(c, makeState(c.clientSecret));
  } catch {
    return Response.redirect(new URL("/admin/more?qb=missing", request.url), 303);
  }
  return Response.redirect(url, 303);
}
