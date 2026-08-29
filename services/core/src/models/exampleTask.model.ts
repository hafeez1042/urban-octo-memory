import { DataTypes, Model, Optional } from "sequelize";
import type { IExampleTask } from "@repo/types/lib/schema/exampleTask";
import sequelize from "../config/database";

type ExampleTaskCreationAttributes = Optional<
  IExampleTask,
  "id" | "created_at" | "updated_at" | "deleted_at" | "completed"
>;

export class ExampleTask
  extends Model<IExampleTask, ExampleTaskCreationAttributes>
  implements IExampleTask
{
  declare id: string;
  declare title: string;
  declare completed: boolean;
  declare created_at: Date;
  declare updated_at: Date;
  declare deleted_at: Date | undefined;
}

ExampleTask.init(
  {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    title: { type: DataTypes.STRING(200), allowNull: false },
    completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE },
  },
  {
    sequelize,
    tableName: "example_tasks",
    underscored: true,
    paranoid: true,
  },
);