import { IQueryStringParams } from "@repo/types/lib/types";

/** `I` defaults to `number` for the same backward-compatibility reason as `IBaseRepository` (P0-06). */
export interface IBaseServices<T, I = number> {
  getAll(query: IQueryStringParams): Promise<T[]>;

  create(data: T): Promise<T>;

  getById(id: I): Promise<T>;

  update(id: I, data: Partial<T>): Promise<T>;

  delete(id: I): Promise<void>;
}
