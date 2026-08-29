import { RequestHandler, Request, Response } from "express";
import { validate as isUuidString } from "uuid";
import { IQueryStringParams } from "@repo/types/lib/types";
import { IAPIV1Response } from "@repo/types/lib/api";
import { ParamsDictionary } from "express";
import { ICRUDController } from "./ICRUDController";
import { IBaseServices } from "../services/IBaseServices";
import { BadRequestError } from "../errors/BadRequestError";

/** Which shape `getId()` parses a route's `:id` parameter into. */
export type IdKind = "number" | "uuid";

/** `I` defaults to `number`; UUID-keyed controllers should pass `string` explicitly. */
export abstract class BaseController<T, I = number> implements ICRUDController<T, I> {
  protected services: IBaseServices<T, I>;
  protected idKind: IdKind;

  constructor(services: IBaseServices<T, I>, idKind: IdKind = "number") {
    this.services = services;
    this.idKind = idKind;
  }

  create: RequestHandler<ParamsDictionary, IAPIV1Response<T>, T> = (req, res) =>
    this.handle(req, res, () => this.services.create(req.body));

  getById: RequestHandler<{ id: string } & ParamsDictionary, IAPIV1Response<T>> = (
    req,
    res
  ) => this.handle(req, res, () => this.services.getById(this.getId(req.params.id)));

  getAll: RequestHandler<
    ParamsDictionary,
    IAPIV1Response<T[]>,
    unknown,
    { query: IQueryStringParams }
  > = (req, res) => this.handle(req, res, () => this.services.getAll(req.query.query));

  update: RequestHandler<
    { id: string } & ParamsDictionary,
    IAPIV1Response<T>,
    Partial<T>
  > = (req, res) =>
    this.handle(req, res, () =>
      this.services.update(this.getId(req.params.id), req.body)
    );

  delete: RequestHandler<{ id: string } & ParamsDictionary, IAPIV1Response<T>> = (
    req,
    res
  ) =>
    this.handle(req, res, async () => {
      await this.services.delete(this.getId(req.params.id));
      return undefined;
    });

  /** Parses the route's `:id` string parameter into the configured identifier type. */
  protected getId(id: string): I {
    if (this.idKind === "uuid") {
      if (!isUuidString(id)) {
        throw new BadRequestError("invalid id");
      }
      return id as unknown as I;
    }

    const parsed = Number(id);
    if (isNaN(parsed)) {
      throw new BadRequestError("invalid id");
    }
    return parsed as unknown as I;
  }

  /** Builds the shared v1 success envelope. */
  protected v1Response<D>(req: Request, data?: D, message?: string): IAPIV1Response<D> {
    return {
      version: "v1",
      success: true,
      data,
      message,
      correlation_id: req.ctx?.correlationId ?? "",
    };
  }

  /**
   * Runs `fn`, wraps its resolved value in the v1 envelope, and writes the response — no
   * controller method needs its own `try/catch`. `fn`'s rejection is not swallowed: this method
   * returns the unhandled promise chain, which Express 5 forwards to `errorHandler` automatically
   * since every CRUD method above returns `this.handle(...)` directly.
   */
  protected handle<D>(
    req: Request,
    res: Response,
    fn: () => Promise<D>,
    message?: string
  ): Promise<void> {
    return fn().then((data) => {
      res.json(this.v1Response(req, data, message));
    });
  }
}
