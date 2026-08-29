import { RequestHandler } from "express";
import { IQueryStringParams } from "@repo/types/lib/types";
import { IAPIV1Response } from "@repo/types/lib/api";
import { ParamsDictionary } from "express";

/** Generic CRUD handler contract parameterized by entity and identifier types. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- `I` keeps this contract aligned with BaseController.
export interface ICRUDController<T = object, I = number, R = T, TCreate = T, TUpdate = T> {
  create?: RequestHandler<ParamsDictionary, IAPIV1Response<R>, TCreate>;
  getAll?: RequestHandler<
    ParamsDictionary,
    IAPIV1Response<R[]>,
    unknown,
    { query: IQueryStringParams }
  >;
  getOne?: RequestHandler<
    ParamsDictionary,
    IAPIV1Response<R>,
    unknown,
    { query: IQueryStringParams }
  >;
  getById?: RequestHandler<{ id: string } & ParamsDictionary, IAPIV1Response<R>>;
  update?: RequestHandler<
    { id: string } & ParamsDictionary,
    IAPIV1Response<R>,
    Partial<TUpdate>
  >;
  delete?: RequestHandler<{ id: string } & ParamsDictionary, IAPIV1Response<R>>;
}
