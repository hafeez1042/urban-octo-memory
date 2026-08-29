import { IQueryStringParams } from "@repo/types/lib/types";
import { IBaseRepository } from "../repositories/IBaseRepository";
import { NotFoundError } from "../errors/NotFoundError";
import { IBaseServices } from "./IBaseServices";

/** `I` defaults to `number` for the same backward-compatibility reason as `BaseRepository` (P0-06). */
export class BaseServices<T, I = number> implements IBaseServices<T, I> {
  protected repository: IBaseRepository<T, I>;
  constructor(repository: IBaseRepository<T, I>) {
    this.repository = repository;
  }

  getAll = async (query: IQueryStringParams) => {
    const items = await this.repository.getAll(query);
    return items;
  };

  create = async (data: T) => {
    const item = await this.repository.create(data);
    return item;
  };

  getById = async (id: I) => {
    const item = await this.repository.getById(id);
    if (!item) throw new NotFoundError();
    return item;
  };
  update = async (id: I, data: Partial<T>) => {
    const item = await this.repository.update(id, data);
    if (!item) throw new NotFoundError();
    return item;
  };

  delete = async (id: I) => {
    await this.repository.delete(id);
    return;
  };
}
