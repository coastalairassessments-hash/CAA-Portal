import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { authorizeUrl, qbConfig } from "@/lib/qb";
import { isAdminUser } from "@/lib/qbAdmin";

export async function GET(request: Request) {
  if (!(await isAdminUser())) return Response.redirect(new URL("/admin/login", request.url), 303);
  let url: string;
  const state = randomBytes(16).toString("hex");
  try {
    url = authorizeUrl(qbConfig(), state);
  } catch {
    return Response.redirect(new URL("/admin/more?qb=missing", request.url), 303);
  }
  (await cookies()).set("qb_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/api/qb", maxAge: 600 });
  return Response.redirect(url, 303);
}
