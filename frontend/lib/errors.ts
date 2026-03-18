// ============================================================
// lib/errors.ts
// Typed HTTP + application error hierarchy
// All API errors are instances of these classes — never plain
// strings, so the UI can switch on error.type cleanly.
// ============================================================

export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "UNKNOWN";

/**
 * Base class for all API errors.
 * Consumers can pattern-match on `instanceof` or on `.code`.
 */
export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly status?: number,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    // Maintains proper prototype chain in transpiled ES5
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NetworkError extends ApiError {
  constructor(cause?: Error) {
    super("NETWORK_ERROR", cause?.message ?? "Network request failed");
    this.name = "NetworkError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TimeoutError extends ApiError {
  constructor(url: string) {
    super("TIMEOUT", `Request timed out: ${url}`);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends ApiError {
  constructor() {
    super("UNAUTHORIZED", "Invalid or missing API key. Configure it in Settings.", 401);
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} not found`, 404);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, context?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, 422, context);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ServerError extends ApiError {
  constructor(status: number, message: string) {
    super("SERVER_ERROR", message, status);
    this.name = "ServerError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Error parser ──────────────────────────────────────────────

/**
 * Converts any thrown value into a structured ApiError instance.
 * Use this in catch blocks to get a consistent error type.
 */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (err instanceof TypeError && err.message.includes("fetch")) {
    return new NetworkError(err);
  }
  if (err instanceof Error && err.name === "AbortError") {
    return new TimeoutError("unknown");
  }
  const message = err instanceof Error ? err.message : String(err);
  return new ApiError("UNKNOWN", message);
}

/**
 * Returns a user-friendly string for any error.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}
