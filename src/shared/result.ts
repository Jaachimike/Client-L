export type ErrorCode = 'ACCESS_DENIED' | 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'SETUP' | 'UNEXPECTED';

export interface ApiError {
  code: ErrorCode;
  message: string;
  fields?: Record<string, string>;
}

export type ApiResult<T> = { ok: true; data: T; error: null } | { ok: false; data: null; error: ApiError };

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data, error: null };
}

export function fail<T = never>(error: ApiError): ApiResult<T> {
  return { ok: false, data: null, error };
}

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
  }

  toApiError(): ApiError {
    return this.fields
      ? { code: this.code, message: this.message, fields: this.fields }
      : { code: this.code, message: this.message };
  }
}
