import { Router } from "express";

const routes: Router = Router();

routes.get("/", (_request, response) => {
  response.json({ version: "v1", success: true, data: { status: "ready" } });
});

export { routes };
