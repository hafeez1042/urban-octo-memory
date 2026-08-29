import { Op, type WhereOptions } from "sequelize";
import { BaseRepository } from "@repo/backend/lib/repositories/BaseRepository.sequelize";
import type { IExampleTask } from "@repo/types/lib/schema/exampleTask";
import { ExampleTask } from "../models/exampleTask.model";

export class ExampleTaskRepository extends BaseRepository<IExampleTask, string> {
  constructor() {
    super(ExampleTask as never);
  }

  getSearchQuery = (searchText: string): WhereOptions<IExampleTask> => ({
    title: { [Op.iLike]: `%${searchText}%` },
  });
}

export const exampleTaskRepository = new ExampleTaskRepository();