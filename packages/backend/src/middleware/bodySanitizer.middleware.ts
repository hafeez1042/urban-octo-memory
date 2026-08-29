import { RequestHandler } from "express";
import { BadRequestError } from "../errors/BadRequestError";

export const bodySanitizerMiddleware = (
  allowedProperties: string[]
): RequestHandler => {
  return (req, res, next) => {
    const unnecessaryProperties = Object.keys(req.body).filter(
      (property) => !allowedProperties.includes(property)
    );

    if (unnecessaryProperties.length > 0) {
      throw new BadRequestError("Invalid data")
    }

    next();
  };
};
