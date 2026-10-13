export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Server liveness only; browser audio and optional AI are separate concerns. */
export function GET(): Response {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
