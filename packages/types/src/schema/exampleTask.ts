import type { IBaseAttributes, ISoftDeleteAttributes } from "../types.sql";

export interface IExampleTask extends IBaseAttributes<string>, ISoftDeleteAttributes {
  title: string;
  completed: boolean;
}