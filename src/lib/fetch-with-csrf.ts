"use client";

import { CSRF_HEADER } from "@/lib/csrf-constants";

let cachedToken: string | null = null;
let inflight: Promise<string> | null = null;

/** Fetch (or reuse) CSRF token; sets `farmos-csrf` cookie via GET /api/csrf. */
export async function fetchCsrfToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  if (!inflight) {
    inflight = fetch("/api/csrf", { credentials: "same-origin" })
      .then(async (res) => {
        const data = (await res.json()) as { token?: string };
        const token = data.token?.trim() || "";
        cachedToken = token;
        return token;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function clearCsrfCache(): void {
  cachedToken = null;
}

export async function csrfHeaders(
  extra?: HeadersInit,
): Promise<Record<string, string>> {
  const token = await fetchCsrfToken();
  const base: Record<string, string> = {
    [CSRF_HEADER]: token,
  };
  if (extra) {
    if (extra instanceof Headers) {
      extra.forEach((v, k) => {
        base[k] = v;
      });
    } else if (Array.isArray(extra)) {
      for (const [k, v] of extra) base[k] = v;
    } else {
      Object.assign(base, extra);
    }
  }
  return base;
}

/** JSON API mutation with CSRF header (POST/PATCH/PUT/DELETE). */
export async function apiMutation(
  url: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<Response> {
  const hasBody = init.json !== undefined || init.body != null;
  const method = (init.method ?? (hasBody ? "POST" : "GET")).toUpperCase();
  const headers = await csrfHeaders(init.headers);
  if (!headers["Content-Type"] && init.json !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const { json, ...rest } = init;
  return fetch(url, {
    ...rest,
    method,
    credentials: rest.credentials ?? "same-origin",
    headers,
    body:
      rest.body ??
      (json !== undefined ? JSON.stringify(json) : undefined),
  });
}