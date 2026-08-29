import { RequestHandler } from "express";
import { IQueryStringParams } from "@repo/types/lib/types";

export const jsonParseQueryParamsMiddleware: RequestHandler<unknown, unknown, unknown, {
  query: unknown
}> = (req, res, next) => {
  if (req.query.query) {
    try {
      req.query.query = JSON.parse(req.query.query as string) as IQueryStringParams;
    } catch {
      return res.status(400).json({ error: 'Invalid JSON data in the query string' });
    }
  }

  next();
}
