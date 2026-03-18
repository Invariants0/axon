// ============================================================
// lib/http.ts
// Production-grade fetch wrapper
// - Reads API key from Zustand persisted localStorage
// - Exponential backoff retry  
// - Per-request AbortController timeout
// - Converts HTTP errors → typed ApiError subclasses
// - Handles 204 No Content gracefully
// ============================================================

import {
  API_BASE_URL,
  API_KEY_HEADER,
  DEFAULT_RETRIES,
  DEFAULT_TIMEOUT_MS,
  STORE_PERSIST_KEY,
} from "./constants";
import {
  ApiError,
  NetworkError,
  NotFoundError,
  ServerError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

// ─── Auth header resolution ───────────────────────────────────

/**
 * Reads the API key from localStorage at call-time (not module load).
 * This means changes in Settings take effect on the next request.
 */
function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORE_PERSIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { apiKey?: string } };
    return parsed?.state?.apiKey ?? null;
  } catch {
    return null;
  }
}

function buildHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  });

  const apiKey = getApiKey();
  if (apiKey) headers.set(API_KEY_HEADER, apiKey);

  if (extra) {
    new Headers(extra).forEach((v, k) => headers.set(k, v));
  }

  return headers;
}

// ─── Response parser ──────────────────────────────────────────

async function parseResponse<T>(response: Response, url: string): Promise<T> {
  // 204 No Content
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (response.ok) {
    if (isJson) return response.json() as Promise<T>;
    // Plain text response (e.g. health check)
    return response.text() as unknown as T;
  }

  // ─── Error responses ─────────────────────────────────────────
  let body: { message?: string; detail?: string | { msg: string }[] } | null = null;
  try {
    if (isJson) body = await response.json();
  } catch { /* ignore */ }

  const detail =
    typeof body?.detail === "string"
      ? body.detail
      : Array.isArray(body?.detail)
      ? body.detail.map((d) => d.msg).join(", ")
      : null;

  const message = detail ?? body?.message ?? `${response.status} ${response.statusText}`;

  switch (response.status) {
    case 401: throw new UnauthorizedError();
    case 403: throw new ApiError("FORBIDDEN", "Access forbidden", 403);
    case 404: throw new NotFoundError(url);
    case 422: throw new ValidationError(message, body ?? undefined);
    default:
      if (response.status >= 500) throw new ServerError(response.status, message);
      throw new ApiError("UNKNOWN", message, response.status);
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────

export interface FetchOptions extends RequestInit {
  /** Number of retry attempts on transient failures (default: 2) */
  retries?: number;
  /** Request timeout in ms (default: 12000) */
  timeoutMs?: number;
  /** Skip adding the base URL prefix (for external requests) */
  absoluteUrl?: boolean;
}

export async function http<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    retries = DEFAULT_RETRIES,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    absoluteUrl = false,
    headers: extraHeaders,
    ...rest
  } = options;

  const url = absoluteUrl ? path : `${API_BASE_URL}${path}`;
  const headers = buildHeaders(extraHeaders ?? {});

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...rest,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timerId);
      return await parseResponse<T>(response, path);
    } catch (err) {
      clearTimeout(timerId);

      // Classify errors
      if (err instanceof ApiError) {
        // Don't retry client errors (4xx)
        if (err.status && err.status >= 400 && err.status < 500) throw err;
        lastError = err;
      } else if (err instanceof Error && err.name === "AbortError") {
        lastError = new TimeoutError(url);
        throw lastError; // Timeouts are not retried
      } else if (err instanceof TypeError) {
        lastError = new NetworkError(err);
      } else {
        lastError = new ApiError("UNKNOWN", String(err));
      }

      // Exponential backoff before retry
      if (attempt < retries) {
        const backoffMs = Math.pow(2, attempt) * 300; // 300ms, 600ms, 1200ms…
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }

  throw lastError ?? new ApiError("UNKNOWN", "Request failed after retries");
}

// ─── Convenience methods ──────────────────────────────────────

export const get  = <T>(path: string, opts?: FetchOptions)             => http<T>(path, { method: "GET",    ...opts });
export const post = <T>(path: string, body?: unknown, opts?: FetchOptions) => http<T>(path, { method: "POST",   body: JSON.stringify(body), ...opts });
export const put  = <T>(path: string, body?: unknown, opts?: FetchOptions) => http<T>(path, { method: "PUT",    body: JSON.stringify(body), ...opts });
export const del  = <T>(path: string, opts?: FetchOptions)             => http<T>(path, { method: "DELETE", ...opts });
export const patch= <T>(path: string, body?: unknown, opts?: FetchOptions) => http<T>(path, { method: "PATCH",  body: JSON.stringify(body), ...opts });
