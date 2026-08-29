import { ApiErrorCodeEnum } from "@repo/types/lib/errors";
import { AppError } from "./AppError";

export class NotAuthorizedError extends AppError {
  constructor(message: string = "Not Authorized") {
    super(ApiErrorCodeEnum.AUTH_INVALID_CREDENTIAL, [], message);

    Object.setPrototypeOf(this, NotAuthorizedError.prototype);
  }
}
