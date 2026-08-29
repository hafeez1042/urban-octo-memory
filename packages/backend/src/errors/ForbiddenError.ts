import { ApiErrorCodeEnum, ERROR_MESSAGE } from "@repo/types/lib/errors";
import { AppError } from "./AppError";

export class ForbiddenError extends AppError {
  constructor() {
    super(ApiErrorCodeEnum.FORBIDDEN, [], ERROR_MESSAGE[ApiErrorCodeEnum.FORBIDDEN]);

    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
