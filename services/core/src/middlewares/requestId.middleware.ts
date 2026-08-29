import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

const REQUEST_ID_HEADER = "X-Request-Id";

export const requestIdMiddleware: RequestHandler = (request, response, next) => {
  const requestId = request.header(REQUEST_ID_HEADER) ?? randomUUID();

  response.setHeader(REQUEST_ID_HEADER, requestId);
  response.locals.requestId = requestId;
  next();
};