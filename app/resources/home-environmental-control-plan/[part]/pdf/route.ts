// The full PDF for one part. While the plan is a draft, only a signed-in admin can download it.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, connection } from "next/server";
import { PLAN_DRAFT, planPart, planPdfFile } from "@/lib/controlPlan";
import { isAdminUser } from "@/lib/planAccess";

export async function GET(_req: Request, ctx: { params: Promise<{ part: string }> }) {
  await connection();
  const { part } = await ctx.params;
  const x = planPart(Number(part));
  if (!x || (PLAN_DRAFT && !(await isAdminUser()))) return new NextResponse("Not found", { status: 404 });
  try {
    const file = await readFile(path.join(process.cwd(), "content", "guides", "home-plan", planPdfFile(x.n)));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="CAA-Home-Plan-Part-${x.n}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
