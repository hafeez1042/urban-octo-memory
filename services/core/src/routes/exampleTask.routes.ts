import { Router } from "express";
import { validate } from "@repo/backend/lib/middleware/validate.middleware";
import {
  createExampleTaskSchema,
  updateExampleTaskSchema,
} from "@repo/types/lib/contracts/exampleTask";
import { exampleTaskController } from "../controllers/exampleTask.controller";

export const exampleTaskRoutes: Router = Router();

exampleTaskRoutes.get("/example-tasks", exampleTaskController.getAll);
exampleTaskRoutes.get("/example-tasks/:id", exampleTaskController.getById);
exampleTaskRoutes.post(
  "/example-tasks",
  validate(createExampleTaskSchema, "body"),
  exampleTaskController.create,
);
exampleTaskRoutes.patch(
  "/example-tasks/:id",
  validate(updateExampleTaskSchema, "body"),
  exampleTaskController.update,
);
exampleTaskRoutes.delete("/example-tasks/:id", exampleTaskController.delete);