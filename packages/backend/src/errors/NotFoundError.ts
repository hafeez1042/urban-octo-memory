import { ApiErrorCodeEnum } from "@repo/types/lib/errors";
import { AppError } from "./AppError";

export class NotFoundError extends AppError {
  constructor() {
    super(ApiErrorCodeEnum.NOT_FOUND);

    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
