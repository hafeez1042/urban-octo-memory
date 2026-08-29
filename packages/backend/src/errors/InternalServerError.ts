import { ApiErrorCodeEnum, ERROR_MESSAGE } from "@repo/types/lib/errors";
import { AppError } from "./AppError";

export class InternalServerError extends AppError {
  constructor(message: string = ERROR_MESSAGE[ApiErrorCodeEnum.INTERNAL_ERROR]) {
    super(ApiErrorCodeEnum.INTERNAL_ERROR, [], message);

    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
