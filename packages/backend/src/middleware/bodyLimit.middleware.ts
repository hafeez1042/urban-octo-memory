import express, { ErrorRequestHandler, RequestHandler } from "express";
import { ApiErrorCodeEnum } from "@repo/types/lib/errors";
import { AppError } from "../errors/AppError";

/**
 * Rejects any request whose declared `Content-Length` exceeds `maxBytes` before a single body
 * byte is read or parsed. This is the fast, common-case path — every JSON client sets
 * `Content-Length` — and it returns the v1 `payload_too_large` envelope instead of falling
 * through to `express.json()`'s own limit handling.
 */
export function contentLengthGuard(maxBytes: number): RequestHandler {
  return (req, _res, next) => {
    const declared = req.headers["content-length"];
    if (declared !== undefined && Number(declared) > maxBytes) {
      next(new AppError(ApiErrorCodeEnum.PAYLOAD_TOO_LARGE));
      return;
    }
    next();
  };
}

/**
 * `body-parser`'s own size guard (used when a caller streams a body without a truthful
 * `Content-Length`, e.g. chunked transfer-encoding) throws a plain `Error` with
 * `type: "entity.too.large"` and `status: 413` — Express's default handler for that renders an
 * HTML error page, not the v1 envelope. This remaps it onto the same `AppError` the
 * `contentLengthGuard` above raises, so every oversize-body path — declared or not — produces
 * a consistent typed response for every oversized body.
 */
function isEntityTooLarge(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    ((err as { type?: unknown }).type === "entity.too.large" ||
      (err as { status?: unknown }).status === 413 ||
      (err as { statusCode?: unknown }).statusCode === 413)
  );
}

const mapEntityTooLarge: ErrorRequestHandler = (err, _req, _res, next) => {
  if (isEntityTooLarge(err)) {
    next(new AppError(ApiErrorCodeEnum.PAYLOAD_TOO_LARGE));
    return;
  }
  next(err);
};

/**
 * Returns the declared-size guard, JSON parser, and parser-error remap in order.
 */
export function bodyLimitMiddleware(maxBytes: number): RequestHandler[] {
  return [
    contentLengthGuard(maxBytes),
    express.json({ limit: maxBytes }),
    mapEntityTooLarge as unknown as RequestHandler,
  ];
}
