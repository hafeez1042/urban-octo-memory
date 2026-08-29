import { ApiErrorCodeEnum } from "@repo/types/lib/errors";
import { AppError } from "./AppError";

const message = "Error connecting to database";

export class DatabaseConnectionError extends AppError {
  constructor() {
    super(ApiErrorCodeEnum.INTERNAL_ERROR, [], message);

    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }
}
