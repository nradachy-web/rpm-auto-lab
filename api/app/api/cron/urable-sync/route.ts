import { withCors, json } from "@/lib/cors";
import { runUrableSync } from "@/lib/urable";

export const runtime = "nodejs";
export const maxDuration = 60;

// Vercel Cron hits this hourly. Gated by CRON_SECRET to avoid abuse.
// Add a cron entry in vercel.json: { "path": "/api/cron/urable-sync", "schedule": "0 */6 * * *" }
export const GET = withCors(async (req) => {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const got = req.headers.get("authorization") || "";
    if (got !== `Bearer ${expected}`) return json({ error: "Forbidden" }, { status: 403 });
  }
  if (!process.env.URABLE_API_TOKEN) return json({ skipped: "no-token" });
  try {
    const result = await runUrableSync();
    return json({ ok: true, ...result });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "sync failed" }, { status: 500 });
  }
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
