import { BaseServices } from "@repo/backend/lib/services/BaseServices";
import type { IExampleTask } from "@repo/types/lib/schema/exampleTask";
import { exampleTaskRepository } from "../repositories/exampleTask.repository";

export class ExampleTaskService extends BaseServices<IExampleTask, string> {
  constructor() {
    super(exampleTaskRepository);
  }
}

export const exampleTaskService = new ExampleTaskService();