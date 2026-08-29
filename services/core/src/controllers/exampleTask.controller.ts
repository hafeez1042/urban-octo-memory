import { BaseController } from "@repo/backend/lib/controller/BaseController";
import type { IExampleTask } from "@repo/types/lib/schema/exampleTask";
import { exampleTaskService } from "../services/exampleTask.service";

export class ExampleTaskController extends BaseController<IExampleTask, string> {
  constructor() {
    super(exampleTaskService, "uuid");
  }
}

export const exampleTaskController = new ExampleTaskController();