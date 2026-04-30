// Thin fetch wrapper for the Vercel API. Authentication is dual-mode:
//   1. Cookies (credentials: "include") — works on desktop where the browser
//      allows third-party cookies between github.io and vercel.app.
//   2. Bearer token in Authorization header — fallback for iOS Safari and
//      other browsers that block cross-site cookies. Token is captured from
//      the login response and persisted to localStorage.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ||
  "https://rpm-auto-lab-api.vercel.app";

const TOKEN_KEY = "rpm_auth_token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch { /* private mode etc */ }
}

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
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const token = getAuthToken();
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  // Auto-capture a freshly issued token (login / register / set-password).
  if (body && typeof body === "object" && "token" in body && typeof (body as { token: unknown }).token === "string") {
    setAuthToken((body as { token: string }).token);
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
    apiFetch<T>(path, {
      method: "POST",
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  patch: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T = unknown>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
