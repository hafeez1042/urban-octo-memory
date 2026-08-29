import { ApiErrorCodeEnum, ERROR_MESSAGE } from "@repo/types/lib/errors";
import { AppError } from "./AppError";

export class ConflictError extends AppError {
  constructor(message: string = ERROR_MESSAGE[ApiErrorCodeEnum.CONFLICT]) {
    super(ApiErrorCodeEnum.CONFLICT, [], message);

    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
