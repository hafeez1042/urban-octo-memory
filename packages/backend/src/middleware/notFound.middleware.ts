import { RequestHandler } from "express";
import { ApiErrorCodeEnum } from "@repo/types/lib/errors";
import { AppError } from "../errors/AppError";

/** Converts unmatched routes to the shared API error envelope. */
export const notFoundMiddleware: RequestHandler = (_req, _res, next) => {
  next(new AppError(ApiErrorCodeEnum.NOT_FOUND));
};
