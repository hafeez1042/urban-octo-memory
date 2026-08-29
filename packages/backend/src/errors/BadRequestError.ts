import { ApiErrorCodeEnum } from "@repo/types/lib/errors";
import { AppError } from "./AppError";

/** Validation error convenience class. */
export class BadRequestError extends AppError {
  constructor(message: string) {
    super(ApiErrorCodeEnum.VALIDATION_FAILED, [], message);

    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}
