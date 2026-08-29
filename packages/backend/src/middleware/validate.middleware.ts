import { RequestHandler } from "express";
import { ZodType } from "zod";
import { ApiErrorCodeEnum } from "@repo/types/lib/errors";
import { AppError } from "../errors/AppError";

export type IValidationSource = "body" | "query" | "params";

export function validate(schema: ZodType, source: IValidationSource): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const fieldPaths = [
        ...new Set(result.error.issues.map((issue) => (issue.path.length > 0 ? issue.path.join(".") : "(root)"))),
      ];
      next(new AppError(ApiErrorCodeEnum.VALIDATION_FAILED, fieldPaths));
      return;
    }

    if (source === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      req[source] = result.data as never;
    }

    next();
  };
}
