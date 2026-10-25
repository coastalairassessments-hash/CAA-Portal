import { submitRequest } from "@/lib/submit";
import { productionDeps } from "@/lib/server-deps";

const MAX_BODY_BYTES = 20_000;

function clientIp(request: Request): string | null {
  const nf = request.headers.get("x-nf-client-connection-ip");
  if (nf) return nf.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return null;
}

export async function POST(request: Request) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return Response.json({ ok: false, error: "Request too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await submitRequest(body, clientIp(request), productionDeps());
    return Response.json(result, { status: result.ok ? 200 : result.status });
  } catch {
    return Response.json(
      {
        ok: false,
        error: "Something went wrong on our end. Please call us and we'll take it from here.",
      },
      { status: 500 },
    );
  }
}
