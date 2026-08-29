export enum SuccessMessages {
  Created = "The item was created successfully",
  Updated = "The item was updated successfully",
  Deleted = "The item was deleted successfully",

  Handshake = "Handshake process completed successfully",
  Logout = "logged out successfully",
}

export enum ErrorMessages {
  itemNotExist = "The item does not exist",
  validationError = "Oops! The format is not correct",
  invalidRequest = "Oops! Invalid request",
  notAuthorized = "The request is understood, but it has been refused or access is not allowed",
  throttled = "The request cannot be served due to the rate limit having been exhausted for the resource",
  serverError = "Something is broken",
  serviceUnavailable = "The server is up, but overloaded with requests. Try again later!"
}

export interface IError {
  code: HttpStatusCodes,
  message: SuccessMessages | ErrorMessages
}

export enum HttpStatusCodes {
  Continue = 100,
  SwitchingProtocols = 101,
  Processing = 102,
  EarlyHints = 103,
  OK = 200,
  Created = 201,
  Accepted = 202,
  NonAuthoritativeInformation = 203,
  NoContent = 204,
  ResetContent = 205,
  PartialContent = 206,
  MultiStatus = 207,
  AlreadyReported = 208,
  IMUsed = 226,
  MultipleChoices = 300,
  MovedPermanently = 301,
  Found = 302,
  SeeOther = 303,
  NotModified = 304,
  UseProxy = 305,
  TemporaryRedirect = 307,
  PermanentRedirect = 308,
  BadRequest = 400,
  Unauthorized = 401,
  PaymentRequired = 402,
  Forbidden = 403,
  NotFound = 404,
  MethodNotAllowed = 405,
  NotAcceptable = 406,
  ProxyAuthenticationRequired = 407,
  RequestTimeout = 408,
  Conflict = 409,
  Gone = 410,
  LengthRequired = 411,
  PreconditionFailed = 412,
  ContentTooLarge = 413,
  URITooLong = 414,
  UnsupportedMediaType = 415,
  RangeNotSatisfiable = 416,
  ExpectationFailed = 417,
  MisdirectedRequest = 421,
  UnprocessableContent = 422,
  Locked = 423,
  FailedDependency = 424,
  TooEarly = 425,
  UpgradeRequired = 426,

  PreconditionRequired = 428,
  TooManyRequests = 429,

  RequestHeaderFieldsTooLarge = 431,
  UnavailableForLegalReasons = 451,
  InternalServerError = 500,
  NotImplemented = 501,
  BadGateway = 502,
  ServiceUnavailable = 503,
  GatewayTimeout = 504,
  HTTPVersionNotSupported = 505,
  VariantAlsoNegotiates = 506,
  InsufficientStorage = 507,
  LoopDetected = 508,
  NetworkAuthenticationRequired = 511,
}

