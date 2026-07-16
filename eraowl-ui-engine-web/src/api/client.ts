/**
 * Lightweight API client for the EraOwl UI Engine backend.
 *
 * Auth is managed via Bearer token stored in sessionStorage (cleared on tab
 * close). For production, prefer httpOnly cookies served by the backend to
 * eliminate XSS exposure entirely.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_BASE ?? "/api";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;
  const url = buildUrl(path, params);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) ?? {}),
  };

  // Prefer sessionStorage over localStorage — cleared on tab close, limiting
  // exposure if an XSS vulnerability is later discovered.
  const token =
    sessionStorage.getItem("auth-token") ?? localStorage.getItem("auth-token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
