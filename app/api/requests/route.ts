import { errorRef, submitRequest } from "@/lib/submit";
import { productionDeps } from "@/lib/server-deps";
import { BodyTooLargeError, readLimitedText } from "@/lib/http";

const MAX_BODY_BYTES = 20_000;

function clientIp(request: Request): string | null {
  const nf = request.headers.get("x-nf-client-connection-ip");
  if (nf) return nf.trim();
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return null;
}

export async function POST(request: Request) {
  // The size is counted as the bytes arrive: a chunked upload has no Content-Length to trust.
  let body: unknown;
  try {
    body = JSON.parse(await readLimitedText(request, MAX_BODY_BYTES));
  } catch (err) {
    if (err instanceof BodyTooLargeError) return Response.json({ ok: false, error: "Request too large" }, { status: 413 });
    return Response.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await submitRequest(body, clientIp(request), productionDeps());
    return Response.json(result, { status: result.ok ? 200 : result.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[requests] server error: ${message}`);
    const stage = message.startsWith("Missing ") ? "config" : "server";
    return Response.json(
      {
        ok: false,
        error: `Something went wrong on our end. Please call us and we'll take it from here. (Ref: ${errorRef(stage, err)})`,
      },
      { status: 500 },
    );
  }
}
