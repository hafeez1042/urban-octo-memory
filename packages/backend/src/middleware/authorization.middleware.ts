import { Request, Response, NextFunction, RequestHandler } from "express";
import { NotAuthorizedError } from "../errors/NotAuthorizedError";

export const authorizationMiddleware = (
  permissionsHandler:
    | string[]
    | ((req: Request<unknown, unknown, unknown, unknown>) => Promise<boolean>),
): RequestHandler<unknown, unknown, unknown, unknown> => {
  return async (req, res: Response, next: NextFunction) => {
    // if (!req.currentUser) {
    //   throw new NotAuthorizedError();
    // }

    if (typeof permissionsHandler === "function") {
      const permissionResponse = await permissionsHandler(req);
      if (permissionResponse) {
        return next();
      }
      throw new NotAuthorizedError();
    }

    // const { permissions } = req.currentUser;

    // if (
    //   !permissions ||
    //   !permissionsHandler.every(
    //     (permission) => permissions?.includes(permission)
    //   )
    // ) {
    //   throw new NotAuthorizedError();
    // }
    next();
  };
};
