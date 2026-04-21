// Thin fetch wrapper for the Vercel API. The base URL is baked in at build
// time via NEXT_PUBLIC_API_BASE so the static GH Pages bundle knows where
// to call. All requests include credentials so the iron-session cookie
// flows across the cross-origin boundary (github.io ↔ vercel.app).

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "https://rpm-auto-lab-api.vercel.app";

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResult<T>> {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });
  } catch (e) {
    return { ok: false, status: 0, data: null, error: (e as Error).message || "Network error" };
  }
  let body: unknown = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try { body = await res.json(); } catch { body = null; }
  } else {
    try { body = await res.text(); } catch { body = null; }
  }
  if (!res.ok) {
    const err = (body && typeof body === "object" && "error" in body && typeof (body as { error: unknown }).error === "string")
      ? (body as { error: string }).error
      : `Request failed (${res.status})`;
    return { ok: false, status: res.status, data: body as T, error: err };
  }
  return { ok: true, status: res.status, data: body as T, error: null };
}

export const api = {
  get: <T = unknown>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T = unknown>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
