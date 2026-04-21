import { withCors, json } from "@/lib/cors";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export const POST = withCors(async () => {
  const session = await getSession();
  session.destroy();
  return json({ ok: true });
});

export const OPTIONS = withCors(async () => new Response(null, { status: 204 }));
