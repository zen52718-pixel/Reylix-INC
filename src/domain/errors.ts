/**
 * Domain error taxonomy. Codes mirror the standard API error shape (Blueprint §4.4):
 * { data: null, error: { code, message, details } }. Controllers map these to HTTP.
 */

export type DomainErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: DomainErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.details = details;
    // Preserve prototype chain when targeting ES5 down-levelers.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('VALIDATION_ERROR', message, details);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('NOT_FOUND', message, details);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('CONFLICT', message, details);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('UNAUTHORIZED', message, details);
  }
}

export class RateLimitedError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('RATE_LIMITED', message, details);
  }
}

/**
 * Thrown by storage backends that are wired into the factory but not yet implemented
 * (the Sheets and Postgres adapters land in later sprints). Surfaces as INTERNAL.
 */
export class NotImplementedError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('INTERNAL', message, details);
  }
}
