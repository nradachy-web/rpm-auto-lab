import { NextResponse } from "next/server";

// Production GH Pages origin + any localhost for dev. Exact match is required
// when Access-Control-Allow-Credentials is true (wildcard is not allowed).
const ALLOWED_ORIGINS = new Set(
  [
    process.env.PUBLIC_ORIGIN, // e.g. "https://nradachy-web.github.io"
    "https://nradachy-web.github.io",
    "https://app.modernapexstrategies.com",
    "http://localhost:3000",
    "http://localhost:3010",
    "http://localhost:3012",
  ].filter(Boolean) as string[]
);

export function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : "";
  if (!allow) return { Vary: "Origin" };
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// Wrap a handler so it (a) short-circuits OPTIONS preflight and (b) sets CORS
// headers on the real response.
type Handler = (req: Request) => Promise<Response> | Response;

export function withCors(handler: Handler): Handler {
  return async (req) => {
    const origin = req.headers.get("origin");
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
    }
    const res = await handler(req);
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(corsHeaders(origin))) headers.set(k, v);
    return new NextResponse(res.body, { status: res.status, headers });
  };
}

export function json(body: unknown, init: ResponseInit = {}): Response {
  return NextResponse.json(body, init);
}
