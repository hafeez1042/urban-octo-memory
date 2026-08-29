import { RequestHandler } from "express";
import { BadRequestError } from "../errors/BadRequestError";

export const serviceNotAvailableMiddleware: RequestHandler = (req, res, next) => {
  void req;
  void res;
  void next;
  throw new BadRequestError("Service temporarily unavailable!");
};
