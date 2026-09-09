/**
 * HTTP response helpers for API route handlers. Centralizes the `{ data, error }` envelope
 * (Blueprint §4.4) and maps DomainError codes to HTTP status codes.
 */
import { NextResponse } from 'next/server';
import { DomainError, type DomainErrorCode } from '@/src/domain/errors';

const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNAUTHORIZED: 401,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export function jsonOk(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ data, error: null }, { status });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ data: null, error: { code, message, details } }, { status });
}

/** Map any thrown error to the standard error response. */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof DomainError) {
    return jsonError(STATUS_BY_CODE[err.code], err.code, err.message, err.details);
  }
  // An unexpected error still returns an opaque body — the client is never told what broke.
  // But it MUST be recorded, or a 500 is undiagnosable from the platform logs. A production
  // misconfiguration once took both public forms down and left nothing behind to read.
  console.error(
    JSON.stringify({
      event: 'unhandled_api_error',
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    }),
  );
  return jsonError(500, 'INTERNAL', 'Unexpected error');
}
