import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "@repo/backend/lib/middleware/errorHandler";
import { notFoundMiddleware } from "@repo/backend/lib/middleware/notFound.middleware";
import { requestIdMiddleware } from "./middlewares/requestId.middleware";
import { routes } from "./routes";
import env from "./config/env";

export function buildApp(): express.Application {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(helmet());
  app.use(requestIdMiddleware);
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });
  app.use("/api/v1", routes);

  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}
