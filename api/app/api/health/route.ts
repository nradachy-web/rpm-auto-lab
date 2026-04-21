import { withCors, json } from "@/lib/cors";

export const runtime = "nodejs";

export const GET = withCors(async () => {
  return json({ ok: true, service: "rpm-auto-lab-api", ts: Date.now() });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
