import { IQueryStringParams } from "@repo/types/lib/types";

/** Generic repository contract parameterized by entity and primary-key types. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- `TUpdate` kept for shape-symmetry with IBaseServices/BaseServices
export interface IBaseRepository<T, I = number, TCreate = T, TUpdate = T> {
  getAll(queryParams: Omit<IQueryStringParams, "cursor">): Promise<T[]>;

  getAllWithCursor(
    queryParams: IQueryStringParams,
    cursorComparison: "lt" | "gt"
  ): Promise<{ items: T[]; nextCursor: I | null }>;

  getById(id: I): Promise<T | null>;

  findOne(queryParams: IQueryStringParams): Promise<T | null>;

  create(data: TCreate): Promise<T>;

  update(
    id: I | undefined,
    data: Partial<T>,
    upsert?: boolean
  ): Promise<T | null>;

  updateMany(query: IQueryStringParams, updateData: Partial<T>): Promise<void>;

  delete(id: I): Promise<void>;

  bulkCreate(data: Partial<T>[]): Promise<T[]>;

  bulkUpdate(updateData: (Partial<T> & { id: I })[]): Promise<void>;

  bulkDelete(query: IQueryStringParams): Promise<void>;

  getSearchQuery?: (searchString: string) => unknown;
}
