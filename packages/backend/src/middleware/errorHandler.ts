import { ErrorRequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { ApiErrorCodeEnum, ERROR_MESSAGE } from "@repo/types/lib/errors";
import { IAPIV1Response } from "@repo/types/lib/api";
import { isAppError } from "../errors/AppError";
import { logger } from "../helpers/logger";

/** Maps known application errors and unexpected failures to a consistent API envelope. */
export const errorHandler: ErrorRequestHandler<unknown, IAPIV1Response<never>> = (
  err,
  req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const correlationId = uuidv4();

  if (isAppError(err)) {
    if (err.code === ApiErrorCodeEnum.RATE_LIMITED && !res.getHeader("Retry-After")) {
      res.setHeader("Retry-After", "1");
    }
    res.status(err.statusCode).json({
      version: "v1",
      success: false,
      code: err.code,
      message: err.message,
      errors: err.details.length > 0 ? err.details : undefined,
      correlation_id: correlationId,
    });
    return;
  }

  logger.error("Unhandled error", {
    correlation_id: correlationId,
    method: req.method,
    path: req.path,
    stack: err instanceof Error ? err.stack : undefined,
  });

  res.status(500).json({
    version: "v1",
    success: false,
    code: ApiErrorCodeEnum.INTERNAL_ERROR,
    message: ERROR_MESSAGE[ApiErrorCodeEnum.INTERNAL_ERROR],
    correlation_id: correlationId,
  });
};
