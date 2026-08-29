import { RequestHandler } from "express";

export const clientTimeZoneMiddleware: RequestHandler = (req, res, next) => {
  const clientTimeZone =
    req.headers["x-time-zone"] ||
    Intl.DateTimeFormat().resolvedOptions().timeZone;
  req.clientTimeZone = clientTimeZone as string;

  next();
};

declare global {
  namespace Express {
    interface Request {
      clientTimeZone: string;
    }
  }
}
