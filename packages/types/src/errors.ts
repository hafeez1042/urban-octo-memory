export enum ApiErrorCodeEnum {
  BAD_REQUEST = "bad_request",
  AUTH_INVALID_CREDENTIAL = "auth_invalid_credential",
  UNAUTHORIZED = "unauthorized",
  FORBIDDEN = "forbidden",
  NOT_FOUND = "not_found",
  CONFLICT = "conflict",
  VALIDATION_FAILED = "validation_failed",
  PAYLOAD_TOO_LARGE = "payload_too_large",
  RATE_LIMITED = "rate_limited",
  INTERNAL_ERROR = "internal_error",
}

export const ERROR_HTTP_STATUS: Record<ApiErrorCodeEnum, number> = {
  [ApiErrorCodeEnum.BAD_REQUEST]: 400,
  [ApiErrorCodeEnum.AUTH_INVALID_CREDENTIAL]: 401,
  [ApiErrorCodeEnum.UNAUTHORIZED]: 401,
  [ApiErrorCodeEnum.FORBIDDEN]: 403,
  [ApiErrorCodeEnum.NOT_FOUND]: 404,
  [ApiErrorCodeEnum.CONFLICT]: 409,
  [ApiErrorCodeEnum.VALIDATION_FAILED]: 422,
  [ApiErrorCodeEnum.PAYLOAD_TOO_LARGE]: 413,
  [ApiErrorCodeEnum.RATE_LIMITED]: 429,
  [ApiErrorCodeEnum.INTERNAL_ERROR]: 500,
};

export const ERROR_MESSAGE: Record<ApiErrorCodeEnum, string> = {
  [ApiErrorCodeEnum.BAD_REQUEST]: "The request is invalid.",
  [ApiErrorCodeEnum.AUTH_INVALID_CREDENTIAL]: "The supplied credential is invalid.",
  [ApiErrorCodeEnum.UNAUTHORIZED]: "Authentication is required.",
  [ApiErrorCodeEnum.FORBIDDEN]: "You do not have permission to perform this action.",
  [ApiErrorCodeEnum.NOT_FOUND]: "The requested resource was not found.",
  [ApiErrorCodeEnum.CONFLICT]: "The request conflicts with the current state.",
  [ApiErrorCodeEnum.VALIDATION_FAILED]: "The request failed validation.",
  [ApiErrorCodeEnum.PAYLOAD_TOO_LARGE]: "The request body exceeds the allowed size.",
  [ApiErrorCodeEnum.RATE_LIMITED]: "Too many requests. Slow down and retry later.",
  [ApiErrorCodeEnum.INTERNAL_ERROR]: "An unexpected error occurred.",
};
