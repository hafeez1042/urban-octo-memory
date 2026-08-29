import { ApiErrorCodeEnum, ERROR_HTTP_STATUS, ERROR_MESSAGE } from "@repo/types/lib/errors";

/** Typed API error with a shared code, status, and default message. */
export class AppError extends Error {
  /**
   * Structural marker checked by `isAppError()` instead of `instanceof`. Workspace packages here
   * are pnpm symlinks; the bundler that loads `services/core`'s tests does not guarantee a single
   * module instance of `@repo/backend` across every import path into it (a direct import and a
   * transitive `require()` from another compiled file in the same package can end up as two
   * distinct class objects with identical source). `instanceof` breaks across that boundary;
   * this flag does not.
   */
  public readonly isAppError = true as const;
  public readonly code: ApiErrorCodeEnum;
  public readonly statusCode: number;
  public readonly details: string[];

  constructor(code: ApiErrorCodeEnum, details: string[] = [], message: string = ERROR_MESSAGE[code]) {
    super(message);
    this.code = code;
    this.statusCode = ERROR_HTTP_STATUS[code];
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /** Compatibility shape for code that expects serialized errors. */
  serializeErrors(): { message: string; field?: string }[] {
    return this.details.length > 0
      ? this.details.map((detail) => ({ message: detail }))
      : [{ message: this.message }];
  }
}

/** Structural check — see the `isAppError` field comment on `AppError` for why. */
export function isAppError(err: unknown): err is AppError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { isAppError?: unknown }).isAppError === true &&
    typeof (err as { code?: unknown }).code === "string" &&
    typeof (err as { statusCode?: unknown }).statusCode === "number"
  );
}
